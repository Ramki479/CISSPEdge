/**
 * cisspMentor.ts
 *
 * Local AI Mentor engine — no API keys, no backend, fully offline.
 *
 * Architecture:
 * 1. Index all learning content, questions, flashcards into a searchable structure
 * 2. Parse user questions, extract key terms
 * 3. Score content against the question using TF-like relevance + domain matching
 * 4. Format the best match into a structured CISSP answer
 * 5. Support tutor modes (Learning, Exam, Mentor, Practice)
 */

import { domainContent } from '../data/learningContent';
import { generateWeaknessInsights, buildWeaknessReport } from './weaknessAnalysis';
import type { DomainAnalytics } from '../types';
import type { TopicAnalytics } from './topicMapping';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type TutorMode = 'learning' | 'exam' | 'mentor' | 'practice' | 'compare';

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  structured?: StructuredAnswer;
  mode?: TutorMode;
  sourceTopic?: { domainId: number; topicId: string; title: string } | null;
}

export interface FlashcardData {
  front: string;
  back: string;
}

export interface ComparisonData {
  conceptA: string;
  conceptB: string;
  similarities: string[];
  differences: { aspect: string; a: string; b: string }[];
  cisspTip: string;
}

export interface StructuredAnswer {
  directAnswer: string;
  explanation: string;
  example?: string;
  cisspPerspective: string;
  keyTakeaways: string[];
  relatedTopics?: { domainId: number; topicId: string; title: string }[];
  source?: string;
  flashcards?: FlashcardData[];
  comparisons?: ComparisonData[];
}

export interface KnowledgeIndexEntry {
  id: string;
  domainId: number;
  domainName: string;
  topicId: string;
  topicTitle: string;
  content: string;
  keywords: string[];
  type: 'overview' | 'keyConcept' | 'example' | 'examTip' | 'takeaway' | 'mistake' | 'whyMatters' | 'flashcard' | 'questionExplained';
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   KNOWLEDGE INDEX — built once at module load
   ═══════════════════════════════════════════════════════════════════════════ */

let _index: KnowledgeIndexEntry[] | null = null;

function buildIndex(): KnowledgeIndexEntry[] {
  const entries: KnowledgeIndexEntry[] = [];

  for (const domain of domainContent) {
    for (const topic of domain.topics) {
      // Overview
      entries.push({
        id: `${topic.id}-overview`,
        domainId: domain.id,
        domainName: domain.shortName,
        topicId: topic.id,
        topicTitle: topic.title,
        content: topic.overview,
        keywords: extractKeywords(topic.overview + ' ' + topic.title + ' ' + topic.subtopics.join(' ')),
        type: 'overview',
      });

      // Why it matters
      entries.push({
        id: `${topic.id}-why`,
        domainId: domain.id,
        domainName: domain.shortName,
        topicId: topic.id,
        topicTitle: topic.title,
        content: topic.whyItMatters,
        keywords: extractKeywords(topic.whyItMatters),
        type: 'whyMatters',
      });

      // Key concepts
      for (const concept of topic.keyConcepts) {
        entries.push({
          id: `${topic.id}-kc-${concept.slice(0, 20)}`,
          domainId: domain.id,
          domainName: domain.shortName,
          topicId: topic.id,
          topicTitle: topic.title,
          content: concept,
          keywords: extractKeywords(concept),
          type: 'keyConcept',
        });
      }

      // Examples
      for (const example of topic.examples) {
        entries.push({
          id: `${topic.id}-ex-${example.slice(0, 20)}`,
          domainId: domain.id,
          domainName: domain.shortName,
          topicId: topic.id,
          topicTitle: topic.title,
          content: example,
          keywords: extractKeywords(example),
          type: 'example',
        });
      }

      // Exam tips
      for (const tip of topic.examTips) {
        entries.push({
          id: `${topic.id}-tip-${tip.slice(0, 20)}`,
          domainId: domain.id,
          domainName: domain.shortName,
          topicId: topic.id,
          topicTitle: topic.title,
          content: tip,
          keywords: extractKeywords(tip),
          type: 'examTip',
        });
      }

      // Key takeaways
      for (const takeaway of topic.keyTakeaways) {
        entries.push({
          id: `${topic.id}-taken-${takeaway.slice(0, 20)}`,
          domainId: domain.id,
          domainName: domain.shortName,
          topicId: topic.id,
          topicTitle: topic.title,
          content: takeaway,
          keywords: extractKeywords(takeaway),
          type: 'takeaway',
        });
      }

      // Common mistakes
      for (const mistake of topic.commonMistakes) {
        entries.push({
          id: `${topic.id}-cm-${mistake.slice(0, 20)}`,
          domainId: domain.id,
          domainName: domain.shortName,
          topicId: topic.id,
          topicTitle: topic.title,
          content: mistake,
          keywords: extractKeywords(mistake),
          type: 'mistake',
        });
      }
    }
  }

  return entries;
}

function getIndex(): KnowledgeIndexEntry[] {
  if (!_index) _index = buildIndex();
  return _index;
}

/* ═══════════════════════════════════════════════════════════════════════════
   KEYWORD EXTRACTION
   ═══════════════════════════════════════════════════════════════════════════ */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'it', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'between', 'under',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'about', 'above', 'across', 'after', 'again',
  'against', 'because', 'before', 'below', 'beneath', 'beside',
  'beyond', 'down', 'inside', 'near', 'off', 'out', 'outside',
  'over', 'round', 'through', 'under', 'up', 'upon', 'what', 'which',
  'who', 'whom', 'whose', 'why', 'how', 'where', 'when',
]);

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

function extractQuestionTerms(question: string): { individual: string[]; phrases: string[] } {
  const lower = question.toLowerCase();

  // Extract quoted phrases
  const phraseMatches = lower.match(/"([^"]+)"/g) || [];
  const phrases = phraseMatches.map(p => p.replace(/"/g, '').trim()).filter(Boolean);

  // Extract individual terms (remove quotes from the text)
  const cleaned = lower.replace(/"[^"]+"/g, '');
  const individual = extractKeywords(cleaned);

  return { individual, phrases };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH & SCORING
   ═══════════════════════════════════════════════════════════════════════════ */

interface ScoredResult {
  entry: KnowledgeIndexEntry;
  score: number;
}

// CISSP-specific domain keyword mapping for smart domain detection
const DOMAIN_KEYWORDS: Record<number, string[]> = {
  1: ['risk management', 'compliance', 'governance', 'ethics', 'business continuity', 'due care', 'due diligence', 'policy', 'bcp', 'drp', 'cia triad', 'confidentiality', 'integrity', 'availability', 'audit', 'regulation', 'gdpr', 'hipaa', 'pci', 'legal', 'security policy', 'standards', 'awareness training', 'separation of duties', 'least privilege'],
  2: ['asset', 'data classification', 'data owner', 'data custodian', 'data lifecycle', 'data retention', 'data destruction', 'data sovereignty', 'privacy', 'pii', 'data masking', 'tokenization', 'data at rest', 'data in transit', 'classification', 'retention', 'sanitization', 'degaussing', 'cryptographic erasure'],
  3: ['security model', 'bell-lapadula', 'biba', 'clark-wilson', 'brewer-nash', 'chinese wall', 'cryptography', 'encryption', 'aes', 'rsa', 'ecc', 'hash', 'digital signature', 'pki', 'certificate', 'tcb', 'common criteria', 'rainbow table', 'salting', 'hsm', 'zero trust', 'architecture'],
  4: ['osi model', 'tcp/ip', 'network', 'firewall', 'router', 'switch', 'vlan', 'vpn', 'dmz', 'ids', 'ips', 'tls', 'ssl', 'ssh', 'dns', 'arp', 'wireless', 'wpa', 'network security', 'segmentation', 'ddos', 'dos', 'man-in-the-middle', 'packet'],
  5: ['iam', 'authentication', 'authorization', 'rbac', 'abac', 'dac', 'mac', 'sso', 'saml', 'oauth', 'openid', 'kerberos', 'ldap', 'mfa', 'biometric', 'password', 'federation', 'privileged access', 'pam', 'provisioning', 'credential'],
  6: ['vulnerability assessment', 'penetration testing', 'pen test', 'sast', 'dast', 'siem', 'audit', 'security testing', 'red team', 'blue team', 'black box', 'white box', 'gray box', 'false positive', 'false negative', 'rules of engagement', 'vulnerability scan'],
  7: ['incident response', 'disaster recovery', 'forensics', 'chain of custody', 'evidence', 'ransomware', 'backup', '3-2-1', 'hot site', 'warm site', 'cold site', 'rto', 'rpo', 'soc', 'monitoring', 'threat intelligence', 'apt', 'containment', 'eradication', 'recovery'],
  8: ['sdlc', 'secure coding', 'owasp', 'sql injection', 'xss', 'devsecops', 'threat modeling', 'stride', 'code review', 'shift left', 'ci/cd', 'input validation', 'tokenization', 'dependency', 'software supply chain'],
};

function scoreQuestion(question: string, entry: KnowledgeIndexEntry, domainAnalytics?: DomainAnalytics[]): number {
  const terms = extractQuestionTerms(question);
  const allTerms = [...terms.individual, ...terms.phrases];
  if (allTerms.length === 0) return 0;

  let score = 0;

  // 1. Term frequency in content
  const contentLower = entry.content.toLowerCase();
  for (const term of allTerms) {
    const occurrences = (contentLower.split(term).length - 1);
    if (occurrences > 0) {
      score += occurrences * 10;
    }
  }

  // 2. Keyword overlap bonus
  for (const term of allTerms) {
    if (entry.keywords.some(k => k.includes(term) || term.includes(k))) {
      score += 15;
    }
  }

  // 3. Title match bonus (higher weight)
  const titleLower = entry.topicTitle.toLowerCase();
  for (const term of allTerms) {
    if (titleLower.includes(term)) {
      score += 25;
    }
  }

  // 4. Domain keyword detection
  for (const [domainId, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (question.toLowerCase().includes(kw)) {
        if (entry.domainId === Number(domainId)) {
          score += 20;
        }
      }
    }
  }

  // 5. Content type bonuses
  if (entry.type === 'overview' || entry.type === 'whyMatters') score += 5;
  if (entry.type === 'example') score += 3;
  if (entry.type === 'examTip') score += 3;
  if (entry.type === 'keyConcept') score += 2;

  // 6. Weak domain bonus — if user is weak in this domain, boost
  if (domainAnalytics) {
    const domainStat = domainAnalytics.find(d => d.domainId === entry.domainId);
    if (domainStat && domainStat.accuracy < 60) {
      score += 5; // Slight boost for weak areas
    }
  }

  return score;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANSWER BUILDING
   ═══════════════════════════════════════════════════════════════════════════ */

function getBestTopicEntries(entry: KnowledgeIndexEntry): {
  overview?: KnowledgeIndexEntry;
  keyConcepts: KnowledgeIndexEntry[];
  examples: KnowledgeIndexEntry[];
  examTips: KnowledgeIndexEntry[];
  takeaways: KnowledgeIndexEntry[];
  mistakes: KnowledgeIndexEntry[];
} {
  const index = getIndex();
  const topicEntries = index.filter(e => e.topicId === entry.topicId);

  return {
    overview: topicEntries.find(e => e.type === 'overview'),
    keyConcepts: topicEntries.filter(e => e.type === 'keyConcept'),
    examples: topicEntries.filter(e => e.type === 'example'),
    examTips: topicEntries.filter(e => e.type === 'examTip'),
    takeaways: topicEntries.filter(e => e.type === 'takeaway'),
    mistakes: topicEntries.filter(e => e.type === 'mistake'),
  };
}

/**
 * Auto-detect relevant comparisons for a topic.
 * Searches COMPARISONS for any pair where either concept appears in the
 * topic title, its domain keywords, or related topics.
 */
function autoDetectComparisons(
  bestEntry: KnowledgeIndexEntry,
): ComparisonData[] {
  const results: ComparisonData[] = [];
  const topicTitle = bestEntry.topicTitle.toLowerCase();
  const domainName = bestEntry.domainName.toLowerCase();

  // Domain 3 has specific topic pairs that map to comparisons
  const domainRelatedPairs: Record<number, string[]> = {
    1: ['due care', 'due diligence', 'bcp', 'drp', 'policy', 'standard'],
    3: ['bell-lapadula', 'biba', 'symmetric', 'asymmetric', 'tcb'],
    4: ['tcp', 'udp', 'ids', 'ips', 'firewall'],
    5: ['saml', 'oauth', 'rbac', 'abac', 'kerberos', 'ldap'],
    7: ['hot site', 'cold site', 'rto', 'rpo'],
  };

  for (const [, comparison] of Object.entries(COMPARISONS)) {
    const alreadyIncluded = results.some(
      r => r.conceptA === comparison.conceptA || r.conceptB === comparison.conceptB,
    );
    if (alreadyIncluded) continue;

    // Check if either concept matches the topic title
    const aMatch = topicTitle.includes(comparison.conceptA.toLowerCase().split(' ')[0]);
    const bMatch = topicTitle.includes(comparison.conceptB.toLowerCase().split(' ')[0]);

    // Check domain-level relevance
    const domainRelevant = domainRelatedPairs[bestEntry.domainId]?.some(kw =>
      comparison.conceptA.toLowerCase().includes(kw) ||
      comparison.conceptB.toLowerCase().includes(kw),
    );

    // Don't include if both concepts match the topic (it would be the topic itself)
    if (aMatch && bMatch) continue;

    if (aMatch || bMatch || domainRelevant) {
      results.push(comparison);
    }
  }

  return results.slice(0, 3); // max 3 comparisons per answer
}

function buildStructuredAnswer(
  bestEntry: KnowledgeIndexEntry,
  mode: TutorMode,
): StructuredAnswer {
  const topicEntries = getBestTopicEntries(bestEntry);
  const domain = domainContent.find(d => d.id === bestEntry.domainId);

  // Build direct answer based on the best matching entry
  let directAnswer = '';
  let explanation = bestEntry.content;
  let cisspPerspective = '';

  if (mode === 'learning') {
    directAnswer = topicEntries.overview
      ? topicEntries.overview.content
      : bestEntry.content;
    cisspPerspective = topicEntries.examTips[0]?.content
      ? `CISSP Perspective: ${topicEntries.examTips[0].content}`
      : 'This concept is important for the CISSP exam. Focus on understanding the core principles and how they apply to real-world scenarios.';
  } else if (mode === 'exam') {
    directAnswer = bestEntry.content;
    cisspPerspective = 'From a CISSP exam perspective, focus on the management and risk-based approach. Think about what a security manager or CISO would decide, not what a technician would implement.';
    if (topicEntries.examTips.length > 1) {
      cisspPerspective += ' Key exam tips:\n' + topicEntries.examTips.slice(0, 3).map(t => `• ${t.content}`).join('\n');
    }
    // Add all key concepts for maximum depth
    if (topicEntries.keyConcepts.length > 0) {
      cisspPerspective += '\n\nAdvanced concepts:\n' + topicEntries.keyConcepts.map(k => `• ${k.content}`).join('\n');
    }
    // Add common mistakes for exam trap awareness
    if (topicEntries.mistakes.length > 0) {
      cisspPerspective += '\n\n⚠️ Common exam traps:\n' + topicEntries.mistakes.slice(0, 2).map(m => `• ${m.content}`).join('\n');
    }
  } else if (mode === 'mentor') {
    directAnswer = `Great question about ${bestEntry.topicTitle}!\n\n${bestEntry.content}`;
    cisspPerspective = `📚 Study Recommendation: Focus on ${bestEntry.topicTitle} within ${domain?.shortName || `Domain ${bestEntry.domainId}`}. ${topicEntries.examTips[0]?.content || ''}`;
    if (topicEntries.keyConcepts.length > 0) {
      cisspPerspective += '\n\nKey areas to master:\n' + topicEntries.keyConcepts.slice(0, 3).map(k => `• ${k.content}`).join('\n');
    }
  } else if (mode === 'compare') {
    // Explain the concept first, then highlight comparisons
    directAnswer = topicEntries.overview
      ? topicEntries.overview.content
      : bestEntry.content;
    cisspPerspective = 'Compare mode — showing how this concept relates to and differs from other CISSP topics.';
    if (topicEntries.examTips.length > 0) {
      cisspPerspective += '\n\n' + topicEntries.examTips.slice(0, 2).map(t => `• ${t.content}`).join('\n');
    }
  } else {
    // practice mode
    directAnswer = bestEntry.content;
    cisspPerspective = 'To apply this knowledge:';
    if (topicEntries.examples.length > 0) {
      cisspPerspective += '\n• ' + topicEntries.examples[0].content;
    }
    if (topicEntries.mistakes.length > 0) {
      cisspPerspective += '\n\n⚠️ Common trap: ' + topicEntries.mistakes[0].content;
    }
  }

  // Build related topics
  const relatedTopics = domain
    ? domain.topics
        .filter(t => t.id !== bestEntry.topicId)
        .slice(0, 3)
        .map(t => ({ domainId: domain.id, topicId: t.id, title: t.title }))
    : [];

  // Auto-detect comparisons for compare mode
  const comparisons = mode === 'compare'
    ? autoDetectComparisons(bestEntry)
    : undefined;

  return {
    directAnswer,
    explanation,
    example: topicEntries.examples[0]?.content,
    cisspPerspective,
    keyTakeaways: topicEntries.takeaways.slice(0, 3).map(t => t.content),
    relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined,
    comparisons: comparisons && comparisons.length > 0 ? comparisons : undefined,
    source: `${domain?.shortName || `Domain ${bestEntry.domainId}`} → ${bestEntry.topicTitle}`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPARE CONCEPTS
   ═══════════════════════════════════════════════════════════════════════════ */

const COMPARISONS: Record<string, ComparisonData> = {
  'saml vs oauth|oauth vs saml': {
    conceptA: 'SAML',
    conceptB: 'OAuth 2.0',
    similarities: ['Both enable SSO and federated identity', 'Both use tokens', 'Both are used for cross-domain authentication'],
    differences: [
      { aspect: 'Purpose', a: 'Authentication (who you are)', b: 'Authorization (what you can access)' },
      { aspect: 'Token format', a: 'XML-based SAML assertions', b: 'JSON-based JWT tokens' },
      { aspect: 'Protocol', a: 'SOAP-based (older, enterprise)', b: 'REST-based (modern, web/mobile)' },
      { aspect: 'Use case', a: 'Enterprise SSO, particularly web apps', b: 'API authorization, mobile apps, delegated access' },
      { aspect: 'Flow', a: 'IdP-initiated or SP-initiated redirects', b: 'Authorization code, implicit, client credentials flows' },
    ],
    cisspTip: 'CISSP Tip: SAML authenticates users; OAuth authorizes applications. OpenID Connect (OIDC) adds authentication on top of OAuth 2.0.',
  },
  'bcp vs drp|drp vs bcp': {
    conceptA: 'BCP (Business Continuity Planning)',
    conceptB: 'DRP (Disaster Recovery Planning)',
    similarities: ['Both deal with organizational resilience', 'Both are part of overall risk management', 'Both require regular testing and updates'],
    differences: [
      { aspect: 'Focus', a: 'Keeping business functions running during disruption', b: 'Restoring IT systems after disruption' },
      { aspect: 'Timing', a: 'Proactive — planned before disruption', b: 'Reactive — executed after disruption' },
      { aspect: 'Scope', a: 'Entire organization, including non-IT processes', b: 'IT infrastructure and systems' },
      { aspect: 'Planning order', a: 'BCP is developed FIRST', b: 'DRP is developed after BCP' },
    ],
    cisspTip: 'CISSP Tip: BCP ensures the business continues; DRP restores IT so the business can resume normal operations. Think of BCP as keeping the lights on and DRP as fixing the generator.',
  },
  'rbac vs abac|abac vs rbac': {
    conceptA: 'RBAC (Role-Based Access Control)',
    conceptB: 'ABAC (Attribute-Based Access Control)',
    similarities: ['Both are access control models', 'Both can enforce least privilege', 'Both support separation of duties'],
    differences: [
      { aspect: 'Basis', a: 'Permissions based on job roles', b: 'Permissions based on attributes (user, resource, environment)' },
      { aspect: 'Granularity', a: 'Coarse-grained (role-level)', b: 'Fine-grained (condition-level)' },
      { aspect: 'Flexibility', a: 'Less flexible — needs new roles for new access patterns', b: 'Highly flexible — dynamic attribute evaluation' },
      { aspect: 'Management', a: 'Easier to manage with fewer roles', b: 'More complex — requires attribute management' },
      { aspect: 'Use case', a: 'Enterprise environments with stable roles', b: 'Dynamic environments requiring contextual access' },
    ],
    cisspTip: 'CISSP Tip: RBAC is simpler and more common. ABAC provides finer control but is more complex. Know that MAC uses labels, DAC uses owner discretion, RBAC uses roles, and ABAC uses attributes.',
  },
  'mac vs dac|dac vs mac': {
    conceptA: 'MAC (Mandatory Access Control)',
    conceptB: 'DAC (Discretionary Access Control)',
    similarities: ['Both are access control models', 'Both determine who can access resources', 'Both are covered in CISSP Domain 5 (IAM)'],
    differences: [
      { aspect: 'Authority', a: 'Central authority sets permissions via security labels', b: 'Data owner sets permissions at their discretion' },
      { aspect: 'Flexibility', a: 'Lower flexibility — users cannot override', b: 'Higher flexibility — owners control access' },
      { aspect: 'Security level', a: 'Higher — used in government/military', b: 'Lower — common in commercial environments' },
      { aspect: 'Use case', a: 'Classified environments requiring strict control', b: 'File sharing, collaborative environments' },
    ],
    cisspTip: 'CISSP Tip: MAC uses labels (Top Secret, Secret, Confidential). DAC uses ACLs. Know that MAC is rule-based while DAC is identity-based.',
  },
  'symmetric vs asymmetric|asymmetric vs symmetric': {
    conceptA: 'Symmetric Cryptography',
    conceptB: 'Asymmetric Cryptography',
    similarities: ['Both protect data confidentiality', 'Both are cryptographic algorithms', 'Both use encryption keys'],
    differences: [
      { aspect: 'Keys', a: 'Single shared key for encrypt/decrypt', b: 'Key pair (public + private)' },
      { aspect: 'Speed', a: 'Fast — suitable for bulk encryption', b: 'Slow — used for key exchange/signatures' },
      { aspect: 'Key distribution', a: 'Challenging — requires secure channel', b: 'Easier — public key can be shared openly' },
      { aspect: 'Use case', a: 'Data at rest encryption (AES-256)', b: 'Digital signatures, TLS handshake (RSA, ECC)' },
    ],
    cisspTip: 'CISSP Tip: Symmetric (AES, DES, 3DES) is fast but has key distribution challenges. Asymmetric (RSA, ECC, Diffie-Hellman) solves key distribution but is slower. Hybrid cryptosystems (e.g., TLS) use both.',
  },
  'ids vs ips|ips vs ids': {
    conceptA: 'IDS (Intrusion Detection System)',
    conceptB: 'IPS (Intrusion Prevention System)',
    similarities: ['Both monitor network traffic', 'Both analyze for threats', 'Both use signatures and anomaly detection'],
    differences: [
      { aspect: 'Action', a: 'Detects and alerts only (passive)', b: 'Detects and blocks in real-time (active)' },
      { aspect: 'Placement', a: 'Out-of-band (monitors copy of traffic)', b: 'In-line (traffic passes through)' },
      { aspect: 'Risk', a: 'No risk of blocking legitimate traffic', b: 'Can block legitimate traffic (false positive risk)' },
      { aspect: 'Response', a: 'Requires human analysis', b: 'Automated blocking and prevention' },
    ],
    cisspTip: 'CISSP Tip: IDS is detective, IPS is preventive. An IPS builds on IDS capabilities but adds active blocking. Know the difference for exam scenarios about real-time prevention vs. monitoring.',
  },
  'bell-lapadula vs biba|biba vs bell-lapadula': {
    conceptA: 'Bell-LaPadula',
    conceptB: 'Biba',
    similarities: ['Both are formal security models', 'Both use subject/object labels', 'Both are lattice-based models'],
    differences: [
      { aspect: 'Primary goal', a: 'Confidentiality', b: 'Integrity' },
      { aspect: 'Read rule', a: 'No read up (can read same/lower level)', b: 'No read down (can read same/higher level)' },
      { aspect: 'Write rule', a: 'No write down (can write same/higher level)', b: 'No write up (can write same/lower level)' },
      { aspect: 'Common use', a: 'Military classification systems', b: 'Commercial integrity protection' },
    ],
    cisspTip: 'CISSP Tip: Bell-LaPadula = confidentiality (no read up, no write down). Biba = integrity (no read down, no write up). Remember: Bell = secrets (don\'t leak), Biba = trust (don\'t corrupt).',
  },
  'tcp vs udp|udp vs tcp': {
    conceptA: 'TCP (Transmission Control Protocol)',
    conceptB: 'UDP (User Datagram Protocol)',
    similarities: ['Both operate at Transport Layer (Layer 4)', 'Both handle data delivery', 'Both use port numbers'],
    differences: [
      { aspect: 'Reliability', a: 'Reliable — guarantees delivery with ACKs', b: 'Unreliable — best-effort delivery' },
      { aspect: 'Connection', a: 'Connection-oriented (3-way handshake)', b: 'Connection-less (no handshake)' },
      { aspect: 'Speed', a: 'Slower due to overhead', b: 'Faster — minimal overhead' },
      { aspect: 'Use case', a: 'Web (HTTP), email (SMTP), file transfer (FTP)', b: 'DNS, VoIP, video streaming, gaming' },
    ],
    cisspTip: 'CISSP Tip: TCP = reliable, ordered delivery. UDP = fast, no guarantees. Know which applications use each protocol.',
  },
  'hot site vs warm site vs cold site|cold site vs warm site vs hot site|warm site vs cold site|hot site vs cold site': {
    conceptA: 'Hot Site',
    conceptB: 'Cold Site',
    similarities: ['Both are alternative recovery facilities', 'Both are part of disaster recovery planning', 'Both provide physical space for operations'],
    differences: [
      { aspect: 'Readiness', a: 'Fully equipped with hardware, software, data', b: 'Empty facility — needs equipment installation' },
      { aspect: 'Recovery time', a: 'Hours to resume operations', b: 'Days to weeks to become operational' },
      { aspect: 'Cost', a: 'Highest cost — constant readiness', b: 'Lowest cost — minimal infrastructure' },
      { aspect: 'Data sync', a: 'Real-time data replication', b: 'No data — must restore from backups' },
    ],
    cisspTip: 'CISSP Tip: Hot = immediate, expensive. Warm = partial setup, medium cost. Cold = empty, cheap. Also know: mobile site, mirrored site, and reciprocal agreement as alternatives.',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SEARCH FUNCTION
   ═══════════════════════════════════════════════════════════════════════════ */

export function searchCisspKnowledge(
  question: string,
  mode: TutorMode = 'learning',
  domainAnalytics?: DomainAnalytics[],
  topicAnalytics?: TopicAnalytics[],
): { answer: StructuredAnswer; topic: { domainId: number; topicId: string; title: string } | null } {
  const index = getIndex();
  const trimmedQuestion = question.trim();

  // Check for comparison queries (matched against known COMPARISONS keys)
  const compareKey = Object.keys(COMPARISONS).find(key =>
    key.split('|').some(pattern => trimmedQuestion.toLowerCase().includes(pattern))
  );
  if (compareKey) {
    return generateComparisonResponse(COMPARISONS[compareKey]);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: INTENT DETECTION — classify what the user is asking
  // ═══════════════════════════════════════════════════════════════════════

  const lowerQuestion = trimmedQuestion.toLowerCase();

  // 1. Study plan intent (checked FIRST to prevent "create" from matching practice questions)
  const isStudyPlanIntent = /study plan|study schedule|learning plan|study roadmap|how (long|many days|many weeks).*cissp|prepare for.*cissp|30.day|60.day|90.day|7.day|14.day|weekly plan|daily schedule|preparation plan/i.test(lowerQuestion);

  // 2. Flashcard generation intent
  const isFlashcardIntent = /flashcard|flash cards?/i.test(lowerQuestion) && /generate|create|make|show|give|want/i.test(lowerQuestion);

  // 3. Weakness/performance query intent
  const isWeaknessIntent = /weak(est|ness| area)?|what should i (study|focus|review)|where.*focus|am i (improving|ready)|exam read(y|iness)|my (weak|strong).*area|how am i (doing|performing)|performance (analysis|review)|knowledge gap/i.test(lowerQuestion);

  // 4. Practice/quiz question intent (more specific patterns to avoid catching study plans)
  const isPracticeIntent = /(practice|quiz|test) (me|my knowledge|questions)|(generate|give me|create) (practice|quiz) (questions|problems|tests)|question me|test my knowledge|practice questions|quiz me/i.test(lowerQuestion);

  // 5. Explain/simple explanation intent
  const isExplainIntent = /explain like|eli5|simple terms|beginner|simplified|explain.*in simple|break down/i.test(lowerQuestion);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: HANDLE BY INTENT (priority order)
  // Comparison intents are handled EARLIER via the COMPARISONS key lookup above
  // ═══════════════════════════════════════════════════════════════════════

  // A. Study Plan Request
  if (isStudyPlanIntent) {
    const targetDomain = domainContent.find(d =>
      lowerQuestion.includes(d.shortName.toLowerCase()) ||
      lowerQuestion.includes(d.title.toLowerCase()) ||
      d.topics.some(t => lowerQuestion.includes(t.title.toLowerCase()))
    );
    return generateStudyPlanResponse(targetDomain || null, lowerQuestion, domainAnalytics);
  }

  // B. Flashcard Request
  if (isFlashcardIntent) {
    return generateFlashcardResponse(trimmedQuestion, lowerQuestion);
  }

  // C. Weakness/Coaching Request
  if (isWeaknessIntent) {
    return generateWeaknessResponse(domainAnalytics, topicAnalytics);
  }

  // D. Practice/Quiz Request
  if (isPracticeIntent) {
    const targetDomain = domainContent.find(d =>
      lowerQuestion.includes(d.shortName.toLowerCase()) ||
      lowerQuestion.includes(d.title.toLowerCase()) ||
      d.topics.some(t => lowerQuestion.includes(t.title.toLowerCase()))
    ) || domainContent.find(d =>
      // Broader match: look for domain keywords in the question
      DOMAIN_KEYWORDS[d.id]?.some(kw => lowerQuestion.includes(kw))
    );
    return generatePracticeResponse(targetDomain || null, trimmedQuestion);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: NORMAL KNOWLEDGE SEARCH — no special intent detected
  // ═══════════════════════════════════════════════════════════════════════

  // Score all entries
  const scored: ScoredResult[] = index.map(entry => ({
    entry,
    score: scoreQuestion(trimmedQuestion, entry, domainAnalytics),
  }));
  scored.sort((a, b) => b.score - a.score);
  const bestMatch = scored.find(s => s.score > 0);

  if (!bestMatch) {
    return generateFallbackResponse(trimmedQuestion, lowerQuestion);
  }

  // Adjust mode for "explain like I'm a beginner"
  const effectiveMode = isExplainIntent ? 'learning' : mode;

  // Build structured answer
  const answer = buildStructuredAnswer(bestMatch.entry, effectiveMode);
  const domain = domainContent.find(d => d.id === bestMatch.entry.domainId);

  return {
    answer,
    topic: domain
      ? { domainId: domain.id, topicId: bestMatch.entry.topicId, title: bestMatch.entry.topicTitle }
      : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTENT-BASED RESPONSE GENERATORS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate a personalized study plan based on duration, performance data, and CISSP exam weights.
 * 30-day: Day-by-day schedule (2-3h daily).
 * 60-day: Detailed week-by-week (1-2h daily).
 * 90-day: Comprehensive plan with milestones (1h daily).
 * All plans prioritize weak domains using actual user performance data.
 */
function generateStudyPlanResponse(
  targetDomain: { id: number; title: string; shortName: string; topics: { id: string; title: string }[] } | null,
  lowerQuestion: string,
  domainAnalytics?: DomainAnalytics[],
): { answer: StructuredAnswer; topic: { domainId: number; topicId: string; title: string } | null } {
  // ─── Detect duration ───────────────────────────────────────────────────
  const daysTotal = /90.*day|90.*d(ay)?|3.*month/i.test(lowerQuestion) ? 90
    : /60.*day|60.*d(ay)?|2.*month|two month/i.test(lowerQuestion) ? 60
    : /30.*day|30.*d(ay)?|month/i.test(lowerQuestion) ? 30
    : /14.*day|14.*d(ay)?|two week|2.*week/i.test(lowerQuestion) ? 14
    : /7.*day|7.*d(ay)?|week$/i.test(lowerQuestion) ? 7
    : 30; // default

  // ─── Build domain list sorted by weakness ──────────────────────────────
  const allDomains = domainContent.map(d => ({
    ...d,
    accuracy: domainAnalytics?.find(da => da.domainId === d.id)?.accuracy ?? 50,
    attempted: domainAnalytics?.find(da => da.domainId === d.id)?.questionsAttempted ?? 0,
  }));

  // Sort weakest-first so weak domains get earlier focus
  const weakDomains = [...allDomains].sort((a, b) => a.accuracy - b.accuracy).filter(d => d.attempted > 0);
  const strongDomains = [...allDomains].sort((a, b) => b.accuracy - a.accuracy).filter(d => d.attempted > 0);

  const hasData = domainAnalytics !== undefined && domainAnalytics.some(d => d.questionsAttempted > 0);
  const overallAccuracy = hasData
    ? Math.round(domainAnalytics!.reduce((s, d) => s + d.accuracy, 0) / domainAnalytics!.length)
    : null;

  // ─── Build schedule based on plan type ─────────────────────────────────
  let schedule: string;
  let studyGoal: string;
  let milestones: string;
  let practiceTests: string;
  let examReadiness: string;

  // Sort domains by exam weight for default ordering behaviour
  const byWeight = [...allDomains].sort((a, b) => b.examWeight - a.examWeight);
  // Priority: domains with accuracy < 60% first (if we have data), then by exam weight
  const priorityDomains = hasData
    ? [...allDomains].sort((a, b) => {
        const aWeak = a.accuracy < 60 ? 1 : 0;
        const bWeak = b.accuracy < 60 ? 1 : 0;
        if (aWeak !== bWeak) return bWeak - aWeak;
        return b.examWeight - a.examWeight;
      })
    : byWeight;

  // Current assessment string
  const currentAssessment = hasData
    ? `**Strengths:**\n${strongDomains.slice(0, 3).map(d => `• ${d.shortName}: ${d.accuracy}%`).join('\n')}\n\n**Weaknesses (priority focus):**\n${weakDomains.slice(0, 3).map(d => `• ${d.shortName}: ${d.accuracy}% ⚠️`).join('\n')}`
    : 'Complete at least one practice test in the Test Engine to receive personalised assessments.';

  // ─── 7-DAY PLAN (intensive sprint, day-by-day) ───────────────────────
  if (daysTotal === 7) {
    studyGoal = `CISSP in 7 Days — Intensive Sprint\n\nThis plan requires 3-4 hours of focused study daily. Designed for last-minute preparation or rapid review for learners who already have solid domain knowledge. Focus on high-weight domains and practice exams.`;

    schedule =
      `**Day 1: Security & Risk Management + Asset Security**\n` +
      `• Study core concepts of D1 (exam weight 15%) — CIA triad, risk management, BCP/DRP\n` +
      `• Study core concepts of D2 (exam weight 10%) — data classification, retention\n` +
      `• Complete knowledge checks for both domains\n` +
      `\n**Day 2: Security Architecture & Engineering**\n` +
      `• Study D3 (exam weight 13%) — security models, cryptography, PKI\n` +
      `• Focus on Bell-LaPadula vs Biba, symmetric vs asymmetric, PKI components\n` +
      `• Complete knowledge checks\n` +
      `\n**Day 3: Network Security**\n` +
      `• Study D4 (exam weight 13%) — OSI model, firewalls, IDS/IPS, VPNs\n` +
      `• Focus on layer-specific attacks and defense-in-depth\n` +
      `• Complete knowledge checks + 15 practice questions\n` +
      `\n**Day 4: IAM + Security Testing**\n` +
      `• Study D5 (exam weight 13%) — authentication factors, access control models, federation\n` +
      `• Study D6 (exam weight 12%) — SAST vs DAST, pen testing methodologies\n` +
      `• Complete knowledge checks for both domains\n` +
      `\n**Day 5: Security Operations + Software Security**\n` +
      `• Study D7 (exam weight 13%) — incident response phases, forensics, SIEM\n` +
      `• Study D8 (exam weight 11%) — SDLC, DevSecOps, OWASP Top 10\n` +
      `• Complete knowledge checks\n` +
      `\n**Day 6: Full Mock Exam**\n` +
      `• Take a full-length practice exam (125 questions, timed)\n` +
      `• Review every incorrect answer in detail\n` +
      `• Note weak areas for final day review\n` +
      `\n**Day 7: Final Review**\n` +
      `• Re-review weak areas identified in mock exam\n` +
      `• Re-read exam tips for all domains\n` +
      `• Review key formulas: SLE, ALE, RTO, RPO\n` +
      `• Rest and confidence building`;

    milestones = `**Milestones**\n` +
      `• Day 3: Complete domains 1-4 with knowledge checks passed\n` +
      `• Day 5: Complete all 8 domains\n` +
      `• Day 6: Score 70%+ on mock exam\n` +
      `• Day 7: Ready for exam`;

    practiceTests = `**Recommended Practice Tests**\n` +
      `• Daily: Knowledge checks after each domain\n` +
      `• Day 3: Mid-week checkpoint (25 questions)\n` +
      `• Day 6: Full-length mock exam (125 questions)`;

    examReadiness = `**Exam Readiness Target**\n` +
      (overallAccuracy !== null
        ? `• Current estimated readiness: ${overallAccuracy}%\n`
        : `• Take a baseline test before starting\n`) +
      `• Target: 75%+ on Day 6 mock exam\n` +
      `• Expected study time: ~24 hours total (3-4h/day)`;
  }

  // ─── 14-DAY PLAN (condensed, day-by-day) ─────────────────────────────
  else if (daysTotal === 14) {
    studyGoal = `CISSP in 14 Days — Condensed Preparation\n\nThis plan requires 2-3 hours daily. Designed for learners with some security background who need structured review across all 8 domains with adequate practice.`;

    schedule =
      `**Day 1: Domain 1 — Security & Risk Management (15%)**\n` +
      `• CIA triad, governance documents, risk management formulas\n` +
      `• BCP/DRP differences, RTO vs RPO, site types\n` +
      `• Complete knowledge check\n` +
      `\n**Day 2: Domain 2 — Asset Security (10%)**\n` +
      `• Data classification, ownership vs custodianship, data lifecycle\n` +
      `• Retention schedules, destruction methods (degaussing, shredding)\n` +
      `• Complete knowledge check\n` +
      `\n**Day 3: Domain 3 — Architecture & Engineering (13%)**\n` +
      `• Security models: Bell-LaPadula, Biba, Clark-Wilson, Chinese Wall\n` +
      `• Cryptography: symmetric vs asymmetric, hashing, digital signatures\n` +
      `• Complete knowledge check\n` +
      `\n**Day 4: Domain 3 continued + Domain 4 intro**\n` +
      `• PKI components, key management, HSMs\n` +
      `• OSI model layers, devices at each layer\n` +
      `• Review + practice questions (15 questions)\n` +
      `\n**Day 5: Domain 4 — Network Security (13%)**\n` +
      `• Firewalls, IDS/IPS, DMZ, VLANs, VPNs\n` +
      `• Wireless security, Zero Trust principles\n` +
      `• Complete knowledge check + practice questions\n` +
      `\n**Day 6: Domain 5 — IAM (13%)**\n` +
      `• Authentication factors, MFA, SSO, Kerberos, LDAP\n` +
      `• Access control models: DAC, MAC, RBAC, ABAC\n` +
      `• Federation: SAML, OAuth, OpenID Connect\n` +
      `\n**Day 7: Domain 5 continued + Mid-point review**\n` +
      `• Practice questions for IAM (15-20 questions)\n` +
      `• Mid-point checkpoint quiz (25 questions across D1-D5)\n` +
      `• Review all mistakes\n` +
      `\n**Day 8: Domain 6 — Assessment & Testing (12%)**\n` +
      `• Vulnerability assessment vs penetration testing\n` +
      `• SAST vs DAST, black/white/gray box testing\n` +
      `• Complete knowledge check\n` +
      `\n**Day 9: Domain 7 — Security Operations (13%)**\n` +
      `• Incident response phases, chain of custody\n` +
      `• SIEM, log management, threat intelligence\n` +
      `• Complete knowledge check\n` +
      `\n**Day 10: Domain 8 — Software Security (11%)**\n` +
      `• Secure SDLC, shift left, DevSecOps\n` +
      `• OWASP Top 10, STRIDE threat modeling\n` +
      `• Complete knowledge check\n` +
      `\n**Day 11-12: Weak Area Reinforcement**\n` +
      (hasData
        ? `Focus on: ${weakDomains.slice(0, 3).map(d => d.shortName).join(', ')}\n` +
          `• Re-read content for weakest domains\n` +
          `• Re-take knowledge checks — aim for 90%+\n`
        : `Review domains that felt most challenging\n` +
          `• Re-read exam tips and key takeaways\n`
      ) +
      `• Practice 25 scenario-based questions\n` +
      `\n**Day 13: Full Mock Exam**\n` +
      `• Take full-length practice exam (125 questions, timed)\n` +
      `• Review every mistake thoroughly\n` +
      `\n**Day 14: Final Review & Confidence**\n` +
      `• Re-review exam tips for lowest-scoring domains\n` +
      `• Review key takeaways and formulas\n` +
      `• Light review only — rest and prepare`;

    milestones = `**Milestones**\n` +
      `• Day 7: Mid-point checkpoint — target 70%+\n` +
      `• Day 10: Complete all 8 domains\n` +
      `• Day 12: Weak area reinforcement complete\n` +
      `• Day 13: Mock exam — target 75%+\n` +
      `• Day 14: Ready for exam`;

    practiceTests = `**Recommended Practice Tests**\n` +
      `• Daily: Knowledge checks for each domain studied\n` +
      `• Day 7: Mid-point checkpoint (25 questions)\n` +
      `• Day 12: Weak domain deep-dive (15 questions per weak domain)\n` +
      `• Day 13: Full-length mock exam (125 questions)`;

    examReadiness = `**Exam Readiness Target**\n` +
      (overallAccuracy !== null
        ? `• Current estimated readiness: ${overallAccuracy}%\n`
        : `• Take a baseline practice test on Day 1\n`) +
      `• Day 7 target: 70%+ on checkpoint quiz\n` +
      `• Day 13 target: 75%+ on mock exam\n` +
      `• Expected study time: ~35 hours total (2.5h/day)`;
  }

  // ─── 30-DAY PLAN (fast-track, day-by-day) ──────────────────────────────
  else if (daysTotal === 30) {
    studyGoal = `Pass CISSP in 30 Days — Fast-Track Preparation\n\nThis intensive plan requires 2-3 hours of focused study daily. Designed for learners who already have basic familiarity with security concepts.`;

    // Build day-by-day schedule
    const domainDayAllocation = priorityDomains.map(d => ({
      ...d,
      days: Math.max(1, Math.round((d.examWeight / 15) * (30 - 8))), // proportional to weight, leaving 8 days for review/exams
    }));
    const totalAllocated = domainDayAllocation.reduce((s, d) => s + d.days, 0);
    // Normalize to fit available days
    const availableDays = 22; // 30 - 4 review - 4 exams
    const scale = availableDays / totalAllocated;
    for (const d of domainDayAllocation) {
      d.days = Math.max(1, Math.round(d.days * scale));
    }

    let dayCounter = 1;
    const dayLines: string[] = [];
    for (const domain of domainDayAllocation) {
      for (let i = 0; i < domain.days && dayCounter <= 22; i++) {
        const topicIdx = i % domain.topics.length;
        const topic = domain.topics[topicIdx];
        const isFirst = i === 0;
        dayLines.push(
          `**Day ${dayCounter}**` +
          `\n• Domain: ${domain.shortName}` +
          `\n• Topic: ${topic?.title || 'Core concepts'}` +
          (isFirst ? `\n• ${domain.title} — exam weight ${domain.examWeight}%` : '') +
          `\n• Activity: ${isFirst ? 'Read topic overview + key concepts + exam tips' : 'Review concepts + take knowledge check + practice 5 questions'}` +
          (i === domain.days - 1 ? `\n• End-of-domain mini-quiz (10 questions)` : '') +
          `\n`
        );
        dayCounter++;
      }
    }

    // Remaining days: practice exams + review
    const remainingStart = dayCounter;
    for (let d = remainingStart; d <= 30; d++) {
      if (d <= 26) {
        dayLines.push(
          `**Day ${d}**` +
          `\n• Weak area review — focus on your lowest-scoring domains` +
          `\n• Practice 20-25 questions from weakest domains` +
          `\n• Review all incorrect answers thoroughly` +
          `\n`
        );
      } else if (d <= 28) {
        dayLines.push(
          `**Day ${d} — Full Mock Exam**` +
          `\n• Simulate real exam conditions (no pauses)` +
          `\n• 100-125 questions across all domains` +
          `\n• Time yourself: max 3 hours` +
          `\n• Review all mistakes after completion` +
          `\n`
        );
      } else {
        dayLines.push(
          `**Day ${d} — Final Review` +
          `\n• Review weak areas from mock exams` +
          `\n• Re-read exam tips for all domains` +
          `\n• Rest and confidence building` +
          `\n`
        );
      }
    }

    schedule = dayLines.join('\n');

    milestones = `**Milestones**\n` +
      `• **Week 1 (Day 7):** Complete domains 1-2 — take checkpoint quiz\n` +
      `• **Week 2 (Day 14):** Complete domains 3-5 — take checkpoint quiz\n` +
      `• **Week 3 (Day 21):** Complete domains 6-8 — take checkpoint quiz\n` +
      `• **Week 4 (Day 28-30):** Full mock exams + final review`;

    practiceTests = `**Recommended Practice Tests**\n` +
      `• End of each domain: Knowledge Check (in Learning Path)\n` +
      `• Day 14: Mid-point progress test (25 questions)\n` +
      `• Day 21: Comprehensive test (50 questions)\n` +
      `• Day 27 & Day 29: Full-length mock exams (125 questions each)`;

    examReadiness = `**Exam Readiness Target**\n` +
      (overallAccuracy !== null
        ? `• Current estimated readiness: ${overallAccuracy}%\n`
        : `• Start by taking a diagnostic practice test\n`) +
      `• Target: 80%+ on mock exams before scheduling\n` +
      `• Expected study time: ~75 hours total (2.5h/day)`;
  }

  // ─── 60-DAY PLAN (balanced, week-by-week with daily detail) ──────────
  else if (daysTotal === 60) {
    studyGoal = `Pass CISSP in 60 Days — Balanced Preparation\n\nThis plan requires 1-2 hours daily. Designed for learners who are new to some CISSP domains and need structured, sequential study.`;

    const weeks = [
      { focus: 'Foundation & Governance', domains: priorityDomains.filter(d => d.id <= 2), detail: 'Start with the CIA triad, risk management frameworks, and data classification. These domains underpin all CISSP concepts.' },
      { focus: 'Architecture & Cryptography', domains: priorityDomains.filter(d => d.id === 3), detail: 'Security models, cryptography, PKI. This is the most technical domain — spend extra time on encryption algorithms and security model rules.' },
      { focus: 'Network Security', domains: priorityDomains.filter(d => d.id === 4), detail: 'OSI model, network protocols, firewalls, VPNs, wireless security. Focus on defense-in-depth and segmentation.' },
      { focus: 'IAM & Testing', domains: priorityDomains.filter(d => d.id >= 5 && d.id <= 6), detail: 'Authentication factors, access control models (DAC/MAC/RBAC/ABAC), federation, security testing methodologies.' },
      { focus: 'Operations & Software Security', domains: priorityDomains.filter(d => d.id >= 7), detail: 'Incident response phases, forensics, SIEM, SDLC, DevSecOps, OWASP Top 10.' },
      { focus: 'Weak Domain Reinforcement', domains: priorityDomains.filter(d => d.accuracy < 60), detail: 'Revisit your lowest-scoring domains. Re-do knowledge checks. Practice scenario-based questions.' },
      { focus: 'Mock Exams & Review', domains: [], detail: 'Full-length practice exams. Review every mistake. Focus on time management and question comprehension.' },
      { focus: 'Final Preparation', domains: [], detail: 'Re-read exam tips. Review key takeaways. Practice relaxation techniques. Confidence building.' },
    ];

    const weekLines = weeks.map((week, i) => {
      let content = `**Week ${i + 1}: ${week.focus}**\n` +
        `${week.detail}\n`;
      if (week.domains.length > 0) {
        content += `Domains to cover:\n` +
          week.domains.map(d => `• ${d.shortName}${d.attempted > 0 ? ` (current: ${d.accuracy}%)` : ''}`).join('\n') + `\n`;
      }
      if (i < 5) {
        content += `\nDaily schedule:\n` +
          `• Day ${i * 7 + 1}-${i * 7 + 2}: Read topic overviews and key concepts\n` +
          `• Day ${i * 7 + 3}-${i * 7 + 4}: Study examples, exam tips, and common mistakes\n` +
          `• Day ${i * 7 + 5}: Review key takeaways and knowledge checks\n` +
          `• Day ${i * 7 + 6}: Take domain-specific practice questions (15-20)\n` +
          `• Day ${i * 7 + 7}: Review incorrect answers and reinforce weak areas`;
      } else if (i === 5) {
        content += `\nThis week is dedicated to your specific weak areas. Spend 1-2 days per weak domain. Re-read content, re-take knowledge checks, and practice 20+ questions per domain.`;
      } else if (i === 6) {
        content += `\n• Day 43-45: Full-length mock exam #1 (125 questions)\n` +
          `• Day 46-47: Review every mistake — understand WHY each wrong answer was incorrect\n` +
          `• Day 48-49: Full-length mock exam #2 (125 questions)\n` +
          `• Day 49: Compare both scores — identify remaining weak areas`;
      } else {
        content += `\n• Day 50-53: Focus on remaining weak areas from mock exams\n` +
          `• Day 54-55: Re-read exam tips for all 8 domains\n` +
          `• Day 56-57: Light review — confidence building\n` +
          `• Day 58-60: Rest, relax, and review key formulas/concepts`;
      }
      return content;
    });

    schedule = weekLines.join('\n\n---\n\n');

    milestones = `**Milestones**\n` +
      `• Week 2: Complete domains 1-2 checkpoint quiz — target 70%+\n` +
      `• Week 4: Complete domains 3-6 checkpoint quiz — target 70%+\n` +
      `• Week 5: Complete all domains — first full practice test\n` +
      `• Week 7: Score 75%+ on mock exams\n` +
      `• Week 8: Score 80%+ on final mock exam`;

    practiceTests = `**Recommended Practice Tests**\n` +
      `• Weekly: Domain-specific 15-20 question quizzes\n` +
      `• Week 4: Mid-program assessment (50 questions)\n` +
      `• Week 6: Weak domain deep-dive (30 questions per weak domain)\n` +
      `• Week 7: Full-length mock exams (125 questions × 2)`;

    examReadiness = `**Exam Readiness Target**\n` +
      (overallAccuracy !== null
        ? `• Current estimated readiness: ${overallAccuracy}%\n`
        : `• Start by taking a baseline practice test\n`) +
      `• Week 4 target: 65%+ on domain quizzes\n` +
      `• Week 7 target: 75%+ on mock exams\n` +
      `• Final target: 80%+ on mock exams before scheduling\n` +
      `• Expected study time: ~90 hours total (1.5h/day)`;
  }

  // ─── 90-DAY PLAN (comprehensive, deep preparation) ────────────────────
  else {
    studyGoal = `Pass CISSP in 90 Days — Deep Preparation\n\nThis plan requires ~1 hour daily. Designed for complete beginners or those wanting thorough mastery. Includes learning, flashcards, mind maps, quizzes, and practice exams.`;

    const month1 = priorityDomains.filter(d => d.id <= 3);
    const month2 = priorityDomains.filter(d => d.id >= 4 && d.id <= 6);
    const month3 = priorityDomains.filter(d => d.id >= 7);
    // Add weak domains from first months into month 3 for reinforcement
    const month1Weak = month1.filter(d => d.accuracy < 60);
    const month2Weak = month2.filter(d => d.accuracy < 60);

    schedule =
      `**Month 1 (Days 1-30): Foundation — Governance, Architecture & Crypto**\n\n` +
      month1.map(d =>
        `**${d.shortName}** (exam weight ${d.examWeight}%)${d.attempted > 0 ? ` — current: ${d.accuracy}%` : ''}\n` +
        `• Days 1-${Math.max(3, Math.round(30 * d.examWeight / 15))}: Read all topic overviews, key concepts, examples\n` +
        `• Create flashcards for key terms and definitions\n` +
        `• Complete all knowledge checks for each topic\n` +
        `• Draw mind maps connecting related concepts\n` +
        `• End-of-month quiz: 25 questions across D1-D3\n`
      ).join('\n') +
      `\n---\n\n` +
      `**Month 2 (Days 31-60): Network, IAM & Testing**\n\n` +
      month2.map(d =>
        `**${d.shortName}** (exam weight ${d.examWeight}%)${d.attempted > 0 ? ` — current: ${d.accuracy}%` : ''}\n` +
        `• Days 31-${30 + Math.max(3, Math.round(30 * d.examWeight / 13))}: Study all topics in depth\n` +
        `• Create flashcards + mind maps for network protocols and access control models\n` +
        `• Complete all knowledge checks\n` +
        `• Practice 20 domain-specific questions\n` +
        `• End-of-month quiz: 25 questions across D4-D6\n`
      ).join('\n') +
      `\n---\n\n` +
      `**Month 3 (Days 61-90): Operations, Software Security & Final Review**\n\n` +
      month3.map(d =>
        `**${d.shortName}** (exam weight ${d.examWeight}%)${d.attempted > 0 ? ` — current: ${d.accuracy}%` : ''}\n` +
        `• Days 61-${60 + Math.max(3, Math.round(30 * d.examWeight / 13))}: Study all topics\n` +
        `• Complete knowledge checks + practice questions\n` +
        `• Focus on incident response phases and SDLC integration\n`
      ).join('\n') +
      `\n\n**Days 75-80: Weak Area Reinforcement**\n` +
      (month1Weak.length > 0 || month2Weak.length > 0
        ? `Revisit and re-study: ${[...month1Weak, ...month2Weak].map(d => d.shortName).join(', ')}\n` +
          `• Re-read topic content for weak areas\n` +
          `• Re-take knowledge checks — aim for 90%+\n` +
          `• Practice 30 scenario-based questions per weak domain\n`
        : `Review all 8 domains — focus on areas that feel least confident\n` +
          `• Re-read exam tips for every domain\n` +
          `• Review all key takeaways\n`
      ) +
      `\n**Days 81-85: Full-Length Mock Exams**\n` +
      `• Mock Exam #1: 125 questions, timed (3 hours)\n` +
      `• Day 82: Comprehensive review of all mistakes\n` +
      `• Mock Exam #2: 125 questions, timed (3 hours)\n` +
      `• Day 84: Compare scores, identify remaining gaps\n` +
      `\n**Days 86-90: Final Preparation**\n` +
      `• Re-read all key takeaways across all domains\n` +
      `• Review mind maps and flashcards one final time\n` +
      `• Focus on formulas: SLE, ALE, RTO, RPO\n` +
      `• Rest, confidence building, light review only`;

    milestones = `**Milestones**\n` +
      `• **Day 30:** Complete D1-D3 — score 70%+ on checkpoint quiz\n` +
      `• **Day 45:** First domain-spanning practice test (50 questions)\n` +
      `• **Day 60:** Complete D4-D6 — score 70%+ on checkpoint quiz\n` +
      `• **Day 75:** Complete all domains — full-length practice test #1\n` +
      `• **Day 85:** Full-length practice test #2 — target 75%+\n` +
      `• **Day 90:** Ready for exam`;

    practiceTests = `**Recommended Practice Tests**\n` +
      `• Weekly: Knowledge checks for completed topics\n` +
      `• Day 30: 25-question checkpoint (D1-D3)\n` +
      `• Day 45: 50-question mid-point assessment\n` +
      `• Day 60: 25-question checkpoint (D4-D6)\n` +
      `• Day 75: Full-length mock exam #1 (125 questions)\n` +
      `• Day 83: Full-length mock exam #2 (125 questions)\n` +
      `• Day 85-90: Targeted weak area quizzes`;

    examReadiness = `**Exam Readiness Target**\n` +
      (overallAccuracy !== null
        ? `• Current estimated readiness: ${overallAccuracy}%\n`
        : `• Take a baseline practice test in Week 1\n`) +
      `• Day 30 target: 65%+ on domain quizzes\n` +
      `• Day 60 target: 70%+ on domain quizzes\n` +
      `• Day 85 target: 75%+ on full mock exams\n` +
      `• Final target: 80%+ before scheduling your exam\n` +
      `• Expected study time: ~90 hours total (1h/day)`;
  }

  return {
    answer: {
      directAnswer: `📚 ${daysTotal}-Day CISSP Study Plan: ${targetDomain ? targetDomain.shortName : 'Comprehensive'}`,
      explanation:
        `## Study Goal\n\n${studyGoal}\n\n` +
        `---\n\n` +
        `## Current Assessment\n\n${currentAssessment}\n\n` +
        `---\n\n` +
        `## ${daysTotal === 30 ? 'Daily' : 'Weekly'} Schedule\n\n${schedule}\n\n` +
        `---\n\n` +
        `${milestones}\n\n` +
        `---\n\n` +
        `${practiceTests}\n\n` +
        `---\n\n` +
        `${examReadiness}`,
      cisspPerspective:
        `**Key Principles for Success**\n\n` +
        `• **Study consistently:** ${daysTotal === 30 ? '2-3 hours' : daysTotal === 60 ? '1-2 hours' : '~1 hour'} daily beats cramming\n` +
        `• **Active recall:** Quiz yourself after every topic — don't just re-read\n` +
        `• **Wrong answer review:** Spend 2× more time on mistakes than correct answers\n` +
        `• **Think like a manager:** CISSP tests management decisions, not technical fixes\n` +
        `• **Use the Learning Path:** This app covers all 8 domains with content, flashcards, and practice`,
      keyTakeaways: [
        `${daysTotal}-day plan: ${daysTotal === 30 ? 'Intensive (2-3h/day)' : daysTotal === 60 ? 'Balanced (1-2h/day)' : 'Deep (1h/day)'} study schedule.`,
        hasData
          ? `Priority domains: ${weakDomains.slice(0, 3).map(d => `${d.shortName} (${d.accuracy}%)`).join(', ')} — focus here first.`
          : 'Complete a practice test to unlock personalized domain prioritization.',
        'Practice tests identify weak areas — do them weekly, not just at the end.',
        'Review every incorrect answer thoroughly — that is where real learning happens.',
        `Use the Learning Path → read topics → knowledge checks → practice tests → flashcards cycle.`,
      ],
      source: `AI-Generated ${daysTotal}-Day CISSP Study Plan${
        hasData ? ' (personalised)' : ''
      }`,
    },
    topic: targetDomain
      ? { domainId: targetDomain.id, topicId: targetDomain.topics[0]?.id || '', title: targetDomain.topics[0]?.title || '' }
      : null,
  };
}

/**
 * Generate practice questions response.
 * ONLY generates practice questions — NO study plans or explanations of concepts.
 */
function generatePracticeResponse(
  targetDomain: { id: number; title: string; shortName: string; topics: { id: string; title: string; knowledgeCheck: { question: string; options: string[]; correctAnswer: number; explanation: string }[] }[] } | null,
  trimmedQuestion: string,
): { answer: StructuredAnswer; topic: { domainId: number; topicId: string; title: string } | null } {
  if (!targetDomain) {
    // Find the most relevant domain via keyword matching
    const found = domainContent.find(d =>
      DOMAIN_KEYWORDS[d.id]?.some(kw => trimmedQuestion.toLowerCase().includes(kw))
    );
    if (!found) {
      return {
        answer: {
          directAnswer: 'Which domain would you like practice questions for?',
          explanation: 'You can specify a domain like "Security and Risk Management" or "Network Security". For example:\n\n• "Generate practice questions for Domain 1"\n• "Quiz me on Network Security"\n• "Practice questions for IAM"',
          cisspPerspective: 'The CISSP exam covers 8 domains. Each domain has knowledge check questions built into the Learning Path.',
          keyTakeaways: ['Specify a domain name for targeted practice questions.', 'Use the Practice Test engine for full exam simulations.'],
        },
        topic: null,
      };
    }
    targetDomain = found;
  }

  const questions = targetDomain.topics.slice(0, 3).flatMap(t =>
    t.knowledgeCheck.slice(0, 2).map(kc => ({
      domainId: targetDomain!.id,
      topicId: t.id,
      question: kc.question,
      options: kc.options,
      correctAnswer: kc.correctAnswer,
      explanation: kc.explanation,
    }))
  );

  if (questions.length === 0) {
    return {
      answer: {
        directAnswer: `No practice questions available for ${targetDomain.shortName} yet.`,
        explanation: 'Try using the Test Engine for full practice tests, or ask about a different domain.',
        cisspPerspective: `Questions in ${targetDomain.shortName} typically test understanding of core concepts and their application.`,
        keyTakeaways: ['Use the Test Engine for full practice.', 'Review the Learning Path content first.'],
      },
      topic: null,
    };
  }

  const qText = questions.map((q, i) =>
    `**Q${i + 1}:** ${q.question}\n${q.options.map((o, j) => `${String.fromCharCode(65 + j)}) ${o}`).join('\n')}`
  ).join('\n\n---\n\n');

  const answerText = questions.map((q, i) => `Q${i + 1}: ${String.fromCharCode(65 + q.correctAnswer)}`).join('\n');

  return {
    answer: {
      directAnswer: `📝 ${questions.length} Practice Questions for ${targetDomain.shortName}`,
      explanation: qText,
      cisspPerspective: `These questions test key concepts from ${targetDomain.shortName}. Take your time and think through each option.\n\n**Answers:**\n${answerText}\n\n${questions.map((q, i) => `**Q${i + 1} Explanation:** ${q.explanation}`).join('\n\n')}`,
      keyTakeaways: [
        `Focus on ${targetDomain.shortName} concepts you find challenging.`,
        'Read the explanation for each answer to deepen understanding.',
        'Use the Test Engine for unlimited randomized practice questions.',
      ],
      source: `${targetDomain.shortName} — Knowledge Check Questions`,
    },
    topic: { domainId: targetDomain.id, topicId: targetDomain.topics[0]?.id || '', title: targetDomain.topics[0]?.title || '' },
  };
}

/**
 * Generate a weakness/coaching response.
 * ONLY generates coaching advice — NO unrelated content.
 */
function generateWeaknessResponse(
  domainAnalytics?: DomainAnalytics[],
  topicAnalytics?: TopicAnalytics[],
): { answer: StructuredAnswer; topic: null } {
  if (!domainAnalytics || domainAnalytics.length === 0 || !domainAnalytics.some(d => d.questionsAttempted > 0)) {
    return {
      answer: {
        directAnswer: 'I need some practice test data to analyze your weaknesses.',
        explanation: 'Complete at least one practice test in the Test Engine, then ask me again! Once you have test data, I can provide:\n\n• Personalized weak area analysis\n• Study recommendations\n• Exam readiness assessment\n• Topic-level performance breakdown',
        cisspPerspective: 'The more practice questions you complete, the more accurate your weakness analysis becomes.',
        keyTakeaways: [
          'Take a practice test in the Test Engine first.',
          'Try to answer at least 20 questions across multiple domains.',
          'Review your results in the Analytics section.',
        ],
      },
      topic: null,
    };
  }

  const insights = generateWeaknessInsights(domainAnalytics);
  const report = buildWeaknessReport(domainAnalytics, topicAnalytics);

  return {
    answer: {
      directAnswer: '🔍 Based on your practice test performance, here is your personalized coaching analysis:',
      explanation: insights.join('\n\n'),
      cisspPerspective: `**Exam Readiness: ${report.overallReadiness}%**\n${report.interpretation}\n\n` +
        `**Domain Breakdown (weakest → strongest):**\n${report.domains.map(d =>
          `• ${d.shortName}: ${Math.round(d.accuracy)}% (${d.bandConfig.label})`
        ).join('\n')}`,
      keyTakeaways: [
        report.criticalWeaknesses.length > 0
          ? `⚠️ Critical: ${report.criticalWeaknesses.map(d => `${d.shortName} (${Math.round(d.accuracy)}%)`).join(', ')}`
          : '✓ No critical weaknesses detected — keep up the good work!',
        `📚 Recommended study time: ~${report.estimatedStudyHours} hours`,
        `🎯 Top priority: ${report.topRecommendedTopics[0]?.title || 'Review weak domains first'}`,
      ],
      source: 'AI Coaching — based on your practice history',
    },
    topic: null,
  };
}

/**
 * Generate a flashcard response.
 * ONLY generates flashcards — NO unrelated content.
 */
function generateFlashcardResponse(
  trimmedQuestion: string,
  lowerQuestion: string,
): { answer: StructuredAnswer; topic: { domainId: number; topicId: string; title: string } | null } {
  const index = getIndex();
  const domain = domainContent.find(d =>
    lowerQuestion.includes(d.shortName.toLowerCase()) ||
    lowerQuestion.includes(d.title.toLowerCase()) ||
    d.topics.some(t => lowerQuestion.includes(t.title.toLowerCase()))
  );

  if (domain) {
    const targetTopic = domain.topics.find(t => lowerQuestion.includes(t.title.toLowerCase())) || domain.topics[0];
    if (targetTopic) {
      const cards = generateFlashcards(targetTopic.id);
      if (cards.length > 0) {
        return {
          answer: {
            directAnswer: `🎴 ${cards.length} Flashcards: ${targetTopic.title}`,
            explanation: `These flashcards cover key concepts from **${targetTopic.title}** in ${domain.shortName}. Use them to test your knowledge and reinforce memorization.`,
            cisspPerspective: `Regular flashcard review with spaced repetition is highly effective for CISSP exam preparation. Review these daily, focusing on cards you struggle with.`,
            keyTakeaways: [
              `${cards.length} flashcards for ${targetTopic.title}`,
              `Domain: ${domain.shortName}`,
              'Tap each card to flip and check your knowledge.',
              'For best results, review daily and track your progress.',
            ],
            source: `${domain.shortName} → ${targetTopic.title}`,
            flashcards: cards,
          },
          topic: { domainId: domain.id, topicId: targetTopic.id, title: targetTopic.title },
        };
      }
    }
  }

  // Fallback: general flashcards
  const allCards: { front: string; back: string }[] = [];
  for (const d of domainContent) {
    for (const t of d.topics) {
      const cards = generateFlashcards(t.id);
      allCards.push(...cards);
      if (allCards.length >= 10) break;
    }
    if (allCards.length >= 10) break;
  }

  if (allCards.length > 0) {
    return {
      answer: {
        directAnswer: `🎴 General CISSP Flashcards (${allCards.length})`,
        explanation: 'Flashcards covering multiple CISSP domains. Review them to test your knowledge across the eight domains.',
        cisspPerspective: 'Flashcards are most effective when focused on specific topics. Try asking for flashcards on a particular domain, e.g., "Generate flashcards for Domain 3".',
        keyTakeaways: [
          `${allCards.length} flashcards covering multiple domains.`,
          'Click each card to flip and reveal the answer.',
          'For topic-specific flashcards, mention a domain or topic name.',
        ],
        source: 'CISSP Knowledge Base — General Flashcards',
        flashcards: allCards,
      },
      topic: null,
    };
  }

  return {
    answer: {
      directAnswer: 'No flashcards available right now.',
      explanation: 'Try asking about a specific topic like "Generate flashcards for Risk Management" or "Create flashcards for Cryptography".',
      cisspPerspective: 'Flashcards are auto-generated from the learning content. The more topics you explore, the more flashcards become available.',
      keyTakeaways: ['Ask about a specific topic for targeted flashcards.', 'Use the Flashcards page for spaced repetition study.'],
    },
    topic: null,
  };
}

/**
 * Generate a comparison response for a known comparison.
 * Called ONLY when the COMPARISONS key lookup already matched above.
 */
function generateComparisonResponse(comparison: ComparisonData): {
  answer: StructuredAnswer;
  topic: { domainId: number; topicId: string; title: string } | null;
} {
  const index = getIndex();
  const topicA = index.find(e => e.content.toLowerCase().includes(comparison.conceptA.toLowerCase().split(' ')[0].toLowerCase()));

  const answer: StructuredAnswer = {
    directAnswer: `Comparing ${comparison.conceptA} vs ${comparison.conceptB}`,
    explanation: comparison.similarities.length > 0
      ? `**Similarities:**\n${comparison.similarities.map(s => `• ${s}`).join('\n')}\n\n**Key Differences:**\n${comparison.differences.map(d => `• **${d.aspect}:** ${comparison.conceptA} → ${d.a} | ${comparison.conceptB} → ${d.b}`).join('\n')}`
      : 'Comparing these two concepts...',
    cisspPerspective: comparison.cisspTip,
    keyTakeaways: [
      `${comparison.conceptA} vs ${comparison.conceptB}: Different purposes, different use cases.`,
      comparison.cisspTip,
    ],
    source: 'CISSP Knowledge Base — Concept Comparison',
  };

  if (topicA) {
    const domain = domainContent.find(d => d.id === topicA.domainId);
    return {
      answer,
      topic: domain
        ? { domainId: domain.id, topicId: topicA.topicId, title: topicA.topicTitle }
        : null,
    };
  }
  return { answer, topic: null };
}

/**
 * Generate a fallback response when no match is found.
 */
function generateFallbackResponse(
  trimmedQuestion: string,
  lowerQuestion: string,
): { answer: StructuredAnswer; topic: null } {
  // Try to find a relevant domain
  const domain = domainContent.find(d =>
    lowerQuestion.includes(d.shortName.toLowerCase()) ||
    lowerQuestion.includes(d.title.toLowerCase()) ||
    d.topics.some(t => lowerQuestion.includes(t.title.toLowerCase()))
  );

  if (domain) {
    return {
      answer: {
        directAnswer: `This relates to **${domain.title}**. Here's an overview of this domain:`,
        explanation: domain.description,
        cisspPerspective: `${domain.title} covers ${domain.examWeight}% of the CISSP exam. The domain includes ${domain.topics.length} topics covering key concepts, real-world examples, and exam tips.`,
        keyTakeaways: [
          `${domain.shortName}: ${domain.topics.length} key topics to master.`,
          `Exam weight: ${domain.examWeight}% of the CISSP exam.`,
          `Start with: ${domain.topics[0]?.title || 'N/A'}`,
        ],
        source: `Domain ${domain.id}: ${domain.shortName}`,
      },
      topic: null,
    };
  }

  return {
    answer: {
      directAnswer: "I don't have specific information about that in my knowledge base.",
      explanation: 'Try asking about a specific CISSP topic, concept, or domain. For example:\n\n• "What is the Bell-LaPadula model?"\n• "Explain the CIA triad"\n• "What are the phases of incident response?"\n• "Create a 30-day study plan"\n• "Practice questions for Network Security"',
      cisspPerspective: 'The CISSP exam covers 8 domains with numerous topics. Try asking about specific concepts within these domains.',
      keyTakeaways: ['Ask about specific CISSP concepts for detailed answers.', 'You can also request study plans, practice questions, or flashcards.', 'Use the Learning Path and Test Engine for comprehensive preparation.'],
    },
    topic: null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   QUICK ACTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

export function getQuickActions(): QuickAction[] {
  return [
    { label: 'My Weakest Areas', prompt: 'What are my weakest areas?', icon: '⊘' },
    { label: 'What Should I Study?', prompt: 'What should I study next?', icon: '🎯' },
    { label: 'Exam Readiness', prompt: 'Am I ready for the CISSP exam?', icon: '◆' },
    { label: 'CIA Triad', prompt: 'Explain the CIA triad in simple terms with examples', icon: '◈' },
    { label: 'SAML vs OAuth', prompt: 'What is the difference between SAML and OAuth?', icon: '⊕' },
    { label: 'Due Care vs Due Diligence', prompt: 'What is due diligence vs due care?', icon: '◆' },
    { label: 'Study Plan', prompt: 'Create a 30-day study plan for CISSP', icon: '⊞' },
    { label: 'Practice Questions', prompt: 'Generate practice questions for Security and Risk Management', icon: '◇' },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   GENERATE FLASHCARDS
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateFlashcards(topicId: string): { front: string; back: string }[] {
  const index = getIndex();
  const topicEntries = index.filter(e => e.topicId === topicId);

  const flashcards: { front: string; back: string }[] = [];

  for (const entry of topicEntries) {
    if (entry.type === 'keyConcept') {
      const parts = entry.content.split(':');
      if (parts.length > 1) {
        flashcards.push({ front: parts[0].trim(), back: parts.slice(1).join(':').trim() });
      } else {
        flashcards.push({ front: `Concept`, back: entry.content });
      }
    }
    if (entry.type === 'examTip') {
      flashcards.push({ front: 'CISSP Exam Tip', back: entry.content });
    }
    if (entry.type === 'takeaway') {
      flashcards.push({ front: 'Key Takeaway', back: entry.content });
    }
  }

  return flashcards.slice(0, 10);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN INSIGHTS (context-aware)
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateDomainInsights(domainAnalytics: DomainAnalytics[]): string[] {
  const insights: string[] = [];

  const sorted = [...domainAnalytics].sort((a, b) => a.accuracy - b.accuracy);
  const best = sorted.filter(d => d.accuracy >= 70 && d.questionsAttempted >= 3);
  const worst = sorted.filter(d => d.accuracy < 60 && d.accuracy > 0 && d.questionsAttempted >= 3);

  if (best.length > 0) {
    insights.push(`You're performing well in: ${best.map(d => {
      const domain = domainContent.find(dc => dc.id === d.domainId);
      return domain?.shortName || `Domain ${d.domainId}`;
    }).join(', ')}.`);
  }

  if (worst.length > 0) {
    insights.push(`Areas needing attention: ${worst.map(d => {
      const domain = domainContent.find(dc => dc.id === d.domainId);
      return domain?.shortName || `Domain ${d.domainId}`;
    }).join(', ')}. Consider reviewing these domains.`);
  }

  if (insights.length === 0) {
    insights.push('Complete some practice tests to get personalized domain insights.');
  }

  return insights;
}
