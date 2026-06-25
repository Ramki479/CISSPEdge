/**
 * weaknessAnalysis.ts
 *
 * AI-Powered Weakness Analysis & Personalized Study Recommendation Engine.
 *
 * Tracks performance across domains, topics, and difficulty levels,
 * generates performance band classifications, trend analysis, exam
 * readiness scoring, and actionable study recommendations.
 */

import { domainContent } from '../data/learningContent';
import { domains } from '../data/domains';
import type { DomainAnalytics, UserAnswer, Question } from '../types';
import type { TopicAnalytics } from './topicMapping';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type PerformanceBand = 'expert' | 'strong' | 'good' | 'needs-review' | 'high-priority' | 'critical';

export interface BandConfig {
  band: PerformanceBand;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  minAccuracy: number;
  maxAccuracy: number;
}

export const PERFORMANCE_BANDS: BandConfig[] = [
  { band: 'expert', label: 'Expert', icon: '◆', color: 'text-[#00f2fe]', bg: 'bg-[#00f2fe]/10', border: 'border-[#00f2fe]/25', minAccuracy: 90, maxAccuracy: 100 },
  { band: 'strong', label: 'Strong', icon: '●', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', border: 'border-[#10b981]/25', minAccuracy: 80, maxAccuracy: 89 },
  { band: 'good', label: 'Good', icon: '◈', color: 'text-[#00bcd4]', bg: 'bg-[#00bcd4]/10', border: 'border-[#00bcd4]/25', minAccuracy: 70, maxAccuracy: 79 },
  { band: 'needs-review', label: 'Needs Review', icon: '◐', color: 'text-[#ffb800]', bg: 'bg-[#ffb800]/10', border: 'border-[#ffb800]/25', minAccuracy: 60, maxAccuracy: 69 },
  { band: 'high-priority', label: 'High Priority', icon: '◉', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/10', border: 'border-[#ff6b6b]/25', minAccuracy: 50, maxAccuracy: 59 },
  { band: 'critical', label: 'Critical', icon: '⊘', color: 'text-[#ff007f]', bg: 'bg-[#ff007f]/10', border: 'border-[#ff007f]/25', minAccuracy: 0, maxAccuracy: 49 },
];

export interface DomainWeaknessAnalysis {
  domainId: number;
  name: string;
  shortName: string;
  examWeight: number;
  accuracy: number;
  questionsAttempted: number;
  correctAnswers: number;
  totalTimeSpent: number;
  avgTimePerQuestion: number;
  band: PerformanceBand;
  bandConfig: BandConfig;
  topicWeaknesses: TopicWeakness[];
  trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
  trendPercentage?: number; // percentage change over recent sessions
}

export interface TopicWeakness {
  topicId: string;
  title: string;
  subtopics: string[];
  accuracy: number; // real accuracy when topic-level data is available
  questionsAttempted: number; // real question count
  priority: number; // 1 = highest priority
}

export interface WeaknessReport {
  domains: DomainWeaknessAnalysis[];
  overallReadiness: number;
  interpretation: string;
  criticalWeaknesses: DomainWeaknessAnalysis[];
  needsReview: DomainWeaknessAnalysis[];
  strongAreas: DomainWeaknessAnalysis[];
  topRecommendedTopics: { domainId: number; topicId: string; title: string; reason: string }[];
  studyPlan: string[];
  estimatedStudyHours: number;
}

export interface TrendDataPoint {
  label: string; // "Week 1", "Month 2", etc.
  accuracy: number;
  questionsAttempted: number;
}

export interface TrendAnalysis {
  domainId: number;
  weeklyTrend: TrendDataPoint[];
  monthlyTrend: TrendDataPoint[];
  overallDirection: 'improving' | 'declining' | 'stable' | 'insufficient-data';
  changePercent: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PERFORMANCE BAND LOOKUP
   ═══════════════════════════════════════════════════════════════════════════ */

export function getPerformanceBand(accuracy: number): BandConfig {
  for (const band of PERFORMANCE_BANDS) {
    if (accuracy >= band.minAccuracy && accuracy <= band.maxAccuracy) return band;
  }
  return PERFORMANCE_BANDS[PERFORMANCE_BANDS.length - 1]; // critical
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN WEAKNESS ANALYSIS
   ═══════════════════════════════════════════════════════════════════════════ */

export function analyzeDomainWeaknesses(
  domainAnalytics: DomainAnalytics[],
  topicAnalytics?: TopicAnalytics[],
): DomainWeaknessAnalysis[] {
  return domainAnalytics.map(da => {
    const domain = domains.find(d => d.id === da.domainId);
    const contentDomain = domainContent.find(d => d.id === da.domainId);
    const band = getPerformanceBand(da.accuracy);
    const avgTime = da.questionsAttempted > 0 ? da.totalTimeSpent / da.questionsAttempted : 0;

    // Build topic weaknesses — use REAL topic analytics when available, fall back to
    // all topics in the domain (with no accuracy data) when no topic data exists yet
    const topicDataForDomain = topicAnalytics?.filter(t => t.domainId === da.domainId) || [];
    const hasRealTopicData = topicDataForDomain.length > 0;

    const topicWeaknesses: TopicWeakness[] = hasRealTopicData
      // REAL data from stored answers
      ? topicDataForDomain.map(t => ({
          topicId: t.topicId,
          title: t.topicTitle,
          subtopics: contentDomain?.topics.find(tp => tp.id === t.topicId)?.subtopics || [],
          accuracy: t.accuracy,
          questionsAttempted: t.questionsAttempted,
          priority: t.accuracy < 60 ? 1 : t.accuracy < 70 ? 2 : t.accuracy < 80 ? 3 : 4,
        }))
      // Fallback: show all topics with no accuracy data yet
      : (contentDomain?.topics || []).map(topic => ({
          topicId: topic.id,
          title: topic.title,
          subtopics: topic.subtopics,
          accuracy: 0,
          questionsAttempted: 0,
          priority: 4,
        }));

    // Sort by priority (weakest first) and take top 5
    topicWeaknesses.sort((a, b) => a.priority - b.priority);

    return {
      domainId: da.domainId,
      name: domain?.name || `Domain ${da.domainId}`,
      shortName: domain?.shortName || `D${da.domainId}`,
      examWeight: domain?.weight || 0,
      accuracy: da.accuracy,
      questionsAttempted: da.questionsAttempted,
      correctAnswers: da.correctAnswers,
      totalTimeSpent: da.totalTimeSpent,
      avgTimePerQuestion: avgTime,
      band,
      bandConfig: band,
      topicWeaknesses: topicWeaknesses.slice(0, 5),
      trend: 'insufficient-data',
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXAM READINESS SCORE
   ═══════════════════════════════════════════════════════════════════════════ */

export function calculateExamReadiness(domainAnalytics: DomainAnalytics[]): {
  score: number;
  interpretation: string;
  components: { name: string; score: number; weight: number }[];
} {
  if (domainAnalytics.length === 0) {
    return { score: 0, interpretation: 'Complete practice tests to calculate your exam readiness.', components: [] };
  }

  // 1. Domain mastery (weighted by exam weight)
  const totalWeight = domains.reduce((s, d) => s + d.weight, 0);
  const domainMastery = domainAnalytics.reduce((sum, da) => {
    const domain = domains.find(d => d.id === da.domainId);
    const weight = domain?.weight || 10;
    const domainScore = da.accuracy * (weight / totalWeight);
    return sum + domainScore;
  }, 0);

  // 2. Coverage factor — have you attempted enough questions?
  const totalQuestions = domainAnalytics.reduce((s, d) => s + d.questionsAttempted, 0);
  const coverageFactor = Math.min(totalQuestions / 100, 1);

  // 3. Consistency factor — low variance across domains is better
  const accuracies = domainAnalytics.filter(d => d.questionsAttempted > 0).map(d => d.accuracy);
  const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 0;
  const variance = accuracies.length > 1
    ? accuracies.reduce((s, a) => s + Math.pow(a - avgAccuracy, 2), 0) / accuracies.length
    : 0;
  const consistencyFactor = Math.max(0, 1 - variance / 2500); // higher variance = lower consistency

  // Composite score
  const score = Math.round(
    domainMastery * 0.5 +
    coverageFactor * 100 * 0.25 +
    consistencyFactor * 100 * 0.25
  );

  // Interpretation
  let interpretation = '';
  if (score >= 85) interpretation = 'You are exam-ready! Maintain your current pace and consider scheduling your exam.';
  else if (score >= 75) interpretation = 'You are approaching exam readiness. Focus on remaining weak areas to push above 85%.';
  else if (score >= 60) interpretation = 'Good progress! Continue focused study, especially on weak domains. Aim for consistent improvement.';
  else if (score >= 40) interpretation = 'Building foundation. Focus on understanding core concepts across all domains before attempting advanced questions.';
  else interpretation = 'Early stage. Complete the Learning Path content and practice fundamentals across all 8 domains.';

  const components = [
    { name: 'Domain Mastery', score: Math.round(domainMastery), weight: 50 },
    { name: 'Coverage', score: Math.round(coverageFactor * 100), weight: 25 },
    { name: 'Consistency', score: Math.round(consistencyFactor * 100), weight: 25 },
  ];

  return { score, interpretation, components };
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOCUS RECOMMENDATIONS — "What should I study next?"
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateFocusRecommendations(
  domainAnalytics: DomainWeaknessAnalysis[],
): { domainId: number; topicId: string; title: string; reason: string; priority: number }[] {
  const recommendations: { domainId: number; topicId: string; title: string; reason: string; priority: number }[] = [];

  // Sort by priority: critical first, then high priority, then needs review, then exam weight tiebreaker
  const sorted = [...domainAnalytics].sort((a, b) => {
    const priorityOrder = { critical: 0, 'high-priority': 1, 'needs-review': 2, good: 3, strong: 4, expert: 5 };
    const aOrder = priorityOrder[a.band] ?? 5;
    const bOrder = priorityOrder[b.band] ?? 5;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Tiebreaker: higher exam weight = higher priority
    return b.examWeight - a.examWeight;
  });

  for (const da of sorted.slice(0, 4)) {
    // Get the weakest topic(s) for this domain
    const weakTopics = da.topicWeaknesses.filter(t => t.accuracy < 70 && t.questionsAttempted > 0);

    if (weakTopics.length > 0) {
      for (const wt of weakTopics.slice(0, 3)) {
        if (recommendations.length >= 5) break;
        recommendations.push({
          domainId: da.domainId,
          topicId: wt.topicId,
          title: wt.title,
          reason: da.band === 'critical' || da.band === 'high-priority'
            ? `${da.bandConfig.label} — ${Math.round(da.accuracy)}% accuracy. Needs immediate attention.`
            : `${Math.round(da.accuracy)}% in ${da.shortName}. Review ${wt.title}.`,
          priority: da.band === 'critical' ? 1 : da.band === 'high-priority' ? 2 : da.band === 'needs-review' ? 3 : 4,
        });
      }
    } else if (da.accuracy < 70) {
      // No topic data but domain is weak
      recommendations.push({
        domainId: da.domainId,
        topicId: '',
        title: da.shortName,
        reason: `${Math.round(da.accuracy)}% accuracy — starts with foundational concepts.`,
        priority: da.band === 'critical' ? 1 : 2,
      });
    }
  }

  return recommendations.slice(0, 5);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PERSONALIZED STUDY PLAN GENERATION
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateStudyPlan(
  recommendations: { domainId: number; title: string; reason: string }[],
  estimatedHoursPerTopic: number = 1.5,
): { steps: string[]; totalHours: number } {
  const steps: string[] = [];
  const topics = recommendations.slice(0, 5);

  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const contentDomain = domainContent.find(d => d.id === t.domainId);
    const topic = contentDomain?.topics.find(tp => tp.title === t.title || tp.title.includes(t.title));

    steps.push(`**${i + 1}. ${t.title}** — ${t.reason}`);
    steps.push(`   • Review lesson: ${topic?.overview?.slice(0, 80) || 'Read learning content'}...`);
    steps.push(`   • Complete knowledge check quiz`);
    if (topic?.examTips && topic.examTips.length > 0) {
      steps.push(`   • Study exam tips: ${topic.examTips[0]}`);
    }
    steps.push(`   • Take 10 practice questions on this topic`);
    steps.push('');
  }

  steps.push('**Next Steps:**');
  steps.push('• Review incorrect answers from practice tests');
  steps.push('• Retake weak-area quiz after 24 hours');
  steps.push('• Track progress in Dashboard');

  const estimatedTopics = topics.length;
  const totalHours = Math.round(estimatedTopics * estimatedHoursPerTopic);

  return { steps, totalHours };
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUILD FULL WEAKNESS REPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildWeaknessReport(
  domainAnalytics: DomainAnalytics[],
  topicAnalytics?: TopicAnalytics[],
): WeaknessReport {
  const domainWeaknesses = analyzeDomainWeaknesses(domainAnalytics, topicAnalytics);
  const readiness = calculateExamReadiness(domainAnalytics);
  const recommendations = generateFocusRecommendations(domainWeaknesses);
  const studyPlan = generateStudyPlan(recommendations);

  // Sort for categorized views
  const sortedByAccuracy = [...domainWeaknesses].sort((a, b) => a.accuracy - b.accuracy);

  const criticalWeaknesses = sortedByAccuracy.filter(
    d => d.band === 'critical' || d.band === 'high-priority',
  );
  const needsReview = sortedByAccuracy.filter(d => d.band === 'needs-review');
  const strongAreas = sortedByAccuracy.filter(
    d => d.band === 'strong' || d.band === 'expert' || d.band === 'good',
  ).reverse();

  return {
    domains: domainWeaknesses,
    overallReadiness: readiness.score,
    interpretation: readiness.interpretation,
    criticalWeaknesses,
    needsReview,
    strongAreas,
    topRecommendedTopics: recommendations,
    studyPlan: studyPlan.steps,
    estimatedStudyHours: studyPlan.totalHours,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   TREND ANALYSIS (weekly progression from answer timestamps)
   ═══════════════════════════════════════════════════════════════════════════ */

export function calculateTrends(
  allAnswers: UserAnswer[],
  domainId: number,
): TrendAnalysis {
  if (allAnswers.length === 0) {
    return {
      domainId,
      weeklyTrend: [],
      monthlyTrend: [],
      overallDirection: 'insufficient-data',
      changePercent: 0,
    };
  }

  // Sort answers by timestamp
  const sorted = [...allAnswers].sort((a, b) => a.timestamp - b.timestamp);

  // Group by week
  const weeklyMap = new Map<string, { correct: number; total: number }>();
  const monthlyMap = new Map<string, { correct: number; total: number }>();

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  for (const answer of sorted) {
    const age = now - answer.timestamp;
    const weekAgo = Math.floor(age / oneWeek);
    const weekLabel = weekAgo === 0 ? 'This Week' : `${weekAgo}w ago`;

    if (weekAgo <= 8) {
      const existing = weeklyMap.get(weekLabel) || { correct: 0, total: 0 };
      existing.total++;
      if (answer.isCorrect) existing.correct++;
      weeklyMap.set(weekLabel, existing);
    }
  }

  const weeklyTrend: TrendDataPoint[] = Array.from(weeklyMap.entries())
    .map(([label, data]) => ({
      label,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      questionsAttempted: data.total,
    }))
    .sort((a, b) => {
      // Sort by week number
      const aNum = a.label === 'This Week' ? 0 : parseInt(a.label);
      const bNum = b.label === 'This Week' ? 0 : parseInt(b.label);
      return bNum - aNum;
    });

  // Determine direction
  let overallDirection: 'improving' | 'declining' | 'stable' | 'insufficient-data' = 'insufficient-data';
  let changePercent = 0;

  if (weeklyTrend.length >= 2) {
    const first = weeklyTrend[0].accuracy;
    const last = weeklyTrend[weeklyTrend.length - 1].accuracy;
    changePercent = last - first;

    if (changePercent > 5) overallDirection = 'improving';
    else if (changePercent < -5) overallDirection = 'declining';
    else overallDirection = 'stable';
  }

  return {
    domainId,
    weeklyTrend,
    monthlyTrend: [],
    overallDirection,
    changePercent,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   WEAK AREA INSIGHTS — for AI Mentor integration
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateWeaknessInsights(
  domainAnalytics: DomainAnalytics[],
): string[] {
  const report = buildWeaknessReport(domainAnalytics);
  const insights: string[] = [];

  if (report.criticalWeaknesses.length > 0) {
    insights.push(
      `Critical Weaknesses: ${report.criticalWeaknesses.map(d =>
        `${d.shortName} (${Math.round(d.accuracy)}%)`
      ).join(', ')}. These need immediate attention.`,
    );
  }

  if (report.needsReview.length > 0) {
    insights.push(
      `Needs Review: ${report.needsReview.map(d =>
        `${d.shortName} (${Math.round(d.accuracy)}%)`
      ).join(', ')}. Review these domains next.`,
    );
  }

  if (report.strongAreas.length > 0) {
    insights.push(
      `Strong Areas: ${report.strongAreas.map(d =>
        `${d.shortName} (${Math.round(d.accuracy)}%)`
      ).join(', ')}.`,
    );
  }

  if (report.topRecommendedTopics.length > 0) {
    const top = report.topRecommendedTopics[0];
    insights.push(`Study Next: ${top.title} — ${top.reason}`);
  }

  insights.push(`Exam Readiness: ${report.overallReadiness}% — ${report.interpretation}`);

  if (report.estimatedStudyHours > 0) {
    insights.push(`Estimated Study Time: ~${report.estimatedStudyHours} hours for recommended topics.`);
  }

  return insights;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN HEATMAP DATA
   ═══════════════════════════════════════════════════════════════════════════ */

export function getHeatmapColor(accuracy: number): string {
  if (accuracy >= 90) return '#00f2fe';
  if (accuracy >= 80) return '#10b981';
  if (accuracy >= 70) return '#00bcd4';
  if (accuracy >= 60) return '#ffb800';
  if (accuracy >= 50) return '#ff6b6b';
  return '#ff007f';
}

export function getHeatmapBg(accuracy: number): string {
  if (accuracy >= 90) return 'bg-[#00f2fe]/15';
  if (accuracy >= 80) return 'bg-[#10b981]/15';
  if (accuracy >= 70) return 'bg-[#00bcd4]/15';
  if (accuracy >= 60) return 'bg-[#ffb800]/15';
  if (accuracy >= 50) return 'bg-[#ff6b6b]/15';
  return 'bg-[#ff007f]/15';
}
