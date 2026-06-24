/**
 * topicMapping.ts
 *
 * Maps question concepts (strings like "CIA Triad", "PKI", "RBAC") to
 * learning content topic IDs so that per-topic accuracy can be tracked
 * directly from stored UserAnswers.
 *
 * This replaces the previous approach of estimating topic accuracy from
 * domain-level data.
 */

import { domainContent } from '../data/learningContent';
import type { Question } from '../types';

/* ═══════════════════════════════════════════════════════════════════════════
   CONCEPT → TOPIC MAPPING
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Build an in-memory index that maps any known concept string (lowercased)
 * to the topic it belongs to.
 *
 * The index is lazy-built and cached for the lifetime of the module.
 */
interface ConceptEntry {
  domainId: number;
  topicId: string;
  topicTitle: string;
  concept: string;
}

let _conceptIndex: ConceptEntry[] | null = null;

function buildConceptIndex(): ConceptEntry[] {
  const entries: ConceptEntry[] = [];

  for (const domain of domainContent) {
    for (const topic of domain.topics) {
      // Add the topic title itself as a concept
      entries.push({
        domainId: domain.id,
        topicId: topic.id,
        topicTitle: topic.title,
        concept: topic.title.toLowerCase(),
      });

      // Add subtopics as concepts
      for (const sub of topic.subtopics) {
        entries.push({
          domainId: domain.id,
          topicId: topic.id,
          topicTitle: topic.title,
          concept: sub.toLowerCase(),
        });
      }

      // Add key concepts from the learning content
      for (const kc of topic.keyConcepts) {
        // Extract the first meaningful phrase (before any colon/punctuation)
        const firstPart = kc.split(':')[0].split('.')[0].trim().toLowerCase();
        if (firstPart.length > 3) {
          entries.push({
            domainId: domain.id,
            topicId: topic.id,
            topicTitle: topic.title,
            concept: firstPart,
          });
        }
      }
    }
  }

  return entries;
}

function getConceptIndex(): ConceptEntry[] {
  if (!_conceptIndex) _conceptIndex = buildConceptIndex();
  return _conceptIndex;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Given a set of concept strings (from a Question), find the best matching
 * topic ID and domain ID.
 *
 * Returns `null` when no mapping can be established (should be rare for
 * well-defined CISSP concepts).
 */
export function resolveQuestionConcepts(
  questionConcepts: string[],
  questionDomainId: number,
): { topicId: string | null; domainId: number } {
  if (!questionConcepts || questionConcepts.length === 0) {
    return { topicId: null, domainId: questionDomainId };
  }

  const index = getConceptIndex();

  // Try each concept in order (first match wins — concepts are ordered by relevance)
  for (const concept of questionConcepts) {
    const lowerConcept = concept.toLowerCase().trim();

    // 1. Exact match within the same domain
    const exactMatch = index.find(
      e => e.concept === lowerConcept && e.domainId === questionDomainId,
    );
    if (exactMatch) return { topicId: exactMatch.topicId, domainId: exactMatch.domainId };

    // 2. Partial match (concept is contained in a topic title or vice versa)
    const partialMatch = index.find(
      e =>
        (e.concept.includes(lowerConcept) || lowerConcept.includes(e.concept)) &&
        e.domainId === questionDomainId,
    );
    if (partialMatch) return { topicId: partialMatch.topicId, domainId: partialMatch.domainId };
  }

  // 3. Fallback: try cross-domain match
  for (const concept of questionConcepts) {
    const lowerConcept = concept.toLowerCase().trim();
    const crossDomain = index.find(
      e => e.concept === lowerConcept || e.concept.includes(lowerConcept) || lowerConcept.includes(e.concept),
    );
    if (crossDomain) return { topicId: crossDomain.topicId, domainId: crossDomain.domainId };
  }

  return { topicId: null, domainId: questionDomainId };
}

/**
 * For a given question, extract both the concepts array and the resolved
 * topicId/domainId that should be stored alongside the answer.
 */
export function getAnswerMetadata(question: Question): {
  concepts: string[];
  topicId: string | null;
  domainId: number;
} {
  const resolved = resolveQuestionConcepts(question.concepts, question.domainId);
  return {
    concepts: question.concepts,
    topicId: resolved.topicId,
    domainId: resolved.domainId,
  };
}

/**
 * Compute per-topic analytics from a list of answers.
 *
 * Unlike DomainAnalytics (which is domain-scoped), this returns accuracy
 * grouped by topicId within each domain.
 */
export interface TopicAnalytics {
  domainId: number;
  topicId: string;
  topicTitle: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
}

export function computeTopicAnalyticsFromAnswers(
  answers: { isCorrect: boolean; concepts?: string[]; topicId?: string; domainId?: number }[],
): TopicAnalytics[] {
  const topicMap = new Map<string, { domainId: number; topicTitle: string; correct: number; total: number }>();

  for (const a of answers) {
    if (!a.topicId) continue; // skip answers with no topic mapping

    const key = `${a.domainId || 0}:${a.topicId}`;
    const existing = topicMap.get(key) || {
      domainId: a.domainId || 0,
      topicTitle: '',
      correct: 0,
      total: 0,
    };
    existing.total++;
    if (a.isCorrect) existing.correct++;

    // Look up the title from learning content (do it once)
    if (!existing.topicTitle) {
      const domain = domainContent.find(d => d.id === (a.domainId || 0));
      const topic = domain?.topics.find(t => t.id === a.topicId);
      if (topic) existing.topicTitle = topic.title;
    }

    topicMap.set(key, existing);
  }

  return Array.from(topicMap.entries()).map(([key, data]) => ({
    domainId: data.domainId,
    topicId: key.split(':')[1],
    topicTitle: data.topicTitle || key.split(':')[1],
    questionsAttempted: data.total,
    correctAnswers: data.correct,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  })).sort((a, b) => a.accuracy - b.accuracy); // weakest first
}
