import type { DomainAnalytics, SkillAssessment, KnowledgeGap, ExamReadinessReport, UserAnswer, Question, SkillArea } from '../types';
import { SKILL_AREAS, SKILL_AREA_TO_DOMAIN } from '../types';
import { domains } from '../data/questionBank';
import { calculateSkillAssessments, identifyKnowledgeGaps, generateExamReadinessReport } from './skillsAssessment';

/* ─── Enhanced Domain Analytics with Trend ─────────────────────────────────── */
export interface EnhancedDomainAnalytics extends DomainAnalytics {
  trend: 'improving' | 'stable' | 'declining' | 'insufficient-data';
  recentAccuracy: number;
  averageTimePerQuestion: number;
  recommendedFocus: string[];
}

export function calculateEnhancedDomainAnalytics(
  domainId: number,
  allAnswers: UserAnswer[],
  questionDomainMap?: Map<string, number>,
): EnhancedDomainAnalytics {
  let questionsAttempted = 0;
  let correctAnswers = 0;
  let totalTimeSpent = 0;
  let recentCorrect = 0;
  let recentTotal = 0;

  // Filter answers by domain if a mapping is provided
  const domainAnswers = questionDomainMap
    ? allAnswers.filter(a => questionDomainMap.get(a.questionId) === domainId)
    : allAnswers;

  // Sort answers by timestamp for trend analysis
  const sorted = [...domainAnswers].sort((a, b) => a.timestamp - b.timestamp);
  const midPoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midPoint);
  const secondHalf = sorted.slice(midPoint);

  for (const answer of sorted) {
    questionsAttempted++;
    if (answer.isCorrect) correctAnswers++;
    totalTimeSpent += answer.timeSpent;
  }

  // Recent performance (last 20 answers or all if less)
  const recentAnswers = sorted.slice(-20);
  recentTotal = recentAnswers.length;
  recentCorrect = recentAnswers.filter(a => a.isCorrect).length;

  const accuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;
  const recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : 0;
  const avgTimePerQuestion = questionsAttempted > 0 ? totalTimeSpent / questionsAttempted : 0;

  // Trend analysis
  let trend: EnhancedDomainAnalytics['trend'] = 'insufficient-data';
  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const firstAccuracy = firstHalf.filter(a => a.isCorrect).length /
      Math.max(1, firstHalf.length);
    const secondAccuracy = secondHalf.filter(a => a.isCorrect).length /
      Math.max(1, secondHalf.length);
    if (secondAccuracy > firstAccuracy + 0.05) trend = 'improving';
    else if (secondAccuracy < firstAccuracy - 0.05) trend = 'declining';
    else trend = 'stable';
  }

  const classification: DomainAnalytics['classification'] =
    accuracy >= 80 ? 'strong' :
    accuracy >= 60 ? 'moderate' :
    accuracy >= 40 ? 'weak' : 'critical';

  return {
    domainId,
    questionsAttempted,
    correctAnswers,
    totalTimeSpent,
    accuracy,
    strengthScore: accuracy,
    classification,
    trend,
    recentAccuracy,
    averageTimePerQuestion: avgTimePerQuestion,
    recommendedFocus: getRecommendedFocus(domainId, classification),
  };
}

function getRecommendedFocus(domainId: number, classification: string): string[] {
  if (classification === 'strong') {
    return ['Maintain with occasional review', 'Focus on advanced scenario-based questions'];
  }
  if (classification === 'moderate') {
    return ['Review weaker sub-topics', 'Practice with time constraints', 'Focus on scenario-based questions'];
  }
  if (classification === 'weak') {
    return ['Review fundamental concepts', 'Complete domain-specific practice tests', 'Create study notes for key topics'];
  }
  return ['Start with foundational concepts', 'Use official CISSP study guide', 'Take structured domain tutorials'];
}

/* ─── Generate Overall Exam Readiness Report ───────────────────────────────── */
export function generateFullExamReadinessReport(
  domainStats: DomainAnalytics[],
  questionHistory: { question: Question; isCorrect: boolean; timeSpent: number }[]
): ExamReadinessReport {
  // Map question answers to skill assessment inputs
  const skillInputs = questionHistory.map(q => ({
    questionId: q.question.id,
    domainId: q.question.domainId,
    difficulty: q.question.difficulty,
    isCorrect: q.isCorrect,
    skillAreas: q.question.skillAreas,
    timeSpent: q.timeSpent,
  }));

  // Get previous assessments from localStorage or use empty
  let previousAssessments: Record<string, { score: number; questionsAttempted: number; correctAnswers: number; lastAssessed: number }> = {};
  try {
    const stored = localStorage.getItem('cissp-skill-assessments');
    if (stored) previousAssessments = JSON.parse(stored);
  } catch { /* ignore */ }

  const skillAssessments = calculateSkillAssessments(skillInputs, previousAssessments);
  const totalQuestions = questionHistory.length;
  const totalCorrect = questionHistory.filter(q => q.isCorrect).length;

  return generateExamReadinessReport(domainStats, skillAssessments, totalQuestions, totalCorrect);
}

/* ─── Domain Readiness Scoring ──────────────────────────────────────────────── */
export function calculateDomainReadinessScore(domainStats: DomainAnalytics[]): number {
  if (domainStats.length === 0) return 0;

  let weightedScore = 0;
  let totalWeight = 0;

  for (const stat of domainStats) {
    const domain = domains.find(d => d.id === stat.domainId);
    const weight = domain?.weight || 10;
    weightedScore += stat.accuracy * (weight / 100);
    totalWeight += weight / 100;
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

/* ─── Weakest Skill Areas ──────────────────────────────────────────────────── */
export function getWeakestSkillAreas(assessments: SkillAssessment[], count: number = 3): SkillAssessment[] {
  return [...assessments]
    .filter(a => a.questionsAttempted > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

/* ─── Study Time Recommendations ────────────────────────────────────────────── */
export function recommendStudyTime(readinessScore: number, weakAreas: number): { hoursPerWeek: number; focus: string } {
  if (readinessScore >= 80) {
    return { hoursPerWeek: 3, focus: 'Maintenance: scenario-based questions and full exam simulations' };
  }
  if (readinessScore >= 60) {
    const hours = 5 + weakAreas;
    return { hoursPerWeek: hours, focus: `Focus on ${weakAreas} weak areas with targeted practice` };
  }
  const hours = 8 + weakAreas * 2;
  return { hoursPerWeek: hours, focus: `Build foundation: focus on fundamentals and address all weak areas` };
}
