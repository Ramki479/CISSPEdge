import type { PreparationLevel, UserAnswer } from '../types';

/* ═══════════════════════════════════════════════════════════════════════════
   5-Level Difficulty System (CISSP CAT-style)
   ═══════════════════════════════════════════════════════════════════════════ */

export type AdaptiveDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTY_ORDER: AdaptiveDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export const DIFFICULTY_VALUES: Record<AdaptiveDifficulty, number> = {
  beginner: 1,
  easy: 2,
  medium: 3,
  hard: 4,
  expert: 5,
};

const DIFFICULTY_LABELS: Record<AdaptiveDifficulty, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

export const difficultyLevels = ['beginner', 'easy', 'medium', 'hard', 'expert'] as const;

export interface AdaptiveConfig {
  initialDifficulty: AdaptiveDifficulty;
  correctStepThreshold: number;   // consecutive correct answers before upshift
  incorrectStepThreshold: number; // consecutive incorrect answers before downshift
  upshiftAccuracy: number;        // accuracy needed in window to upshift (0-1)
  downshiftAccuracy: number;      // accuracy below which to downshift (0-1)
  windowSize: number;             // sliding window for performance eval
  maxJump: number;                // max difficulty levels to jump at once
}

export function getAdaptiveConfig(level: PreparationLevel): AdaptiveConfig {
  switch (level) {
    case 'beginner':
      return {
        initialDifficulty: 'beginner',
        correctStepThreshold: 3,
        incorrectStepThreshold: 2,
        upshiftAccuracy: 0.75,
        downshiftAccuracy: 0.30,
        windowSize: 5,
        maxJump: 1,
      };
    case 'intermediate':
      return {
        initialDifficulty: 'medium',
        correctStepThreshold: 2,
        incorrectStepThreshold: 2,
        upshiftAccuracy: 0.70,
        downshiftAccuracy: 0.35,
        windowSize: 5,
        maxJump: 1,
      };
    case 'advanced':
      return {
        initialDifficulty: 'hard',
        correctStepThreshold: 2,
        incorrectStepThreshold: 2,
        upshiftAccuracy: 0.65,
        downshiftAccuracy: 0.30,
        windowSize: 4,
        maxJump: 1,
      };
    case 'expert':
      return {
        initialDifficulty: 'expert',
        correctStepThreshold: 1,
        incorrectStepThreshold: 1,
        upshiftAccuracy: 0.60,
        downshiftAccuracy: 0.25,
        windowSize: 3,
        maxJump: 1,
      };
  }
}

/**
 * CISSP CAT-style adaptive difficulty calculation.
 * Uses a sliding window of recent answers + consecutive streak analysis
 * to smoothly adjust difficulty without abrupt jumps.
 */
export function calculateDynamicDifficulty(
  history: UserAnswer[],
  currentDifficulty: AdaptiveDifficulty,
  config: AdaptiveConfig,
): AdaptiveDifficulty {
  const currentIdx = DIFFICULTY_VALUES[currentDifficulty];

  if (history.length < 2) return currentDifficulty;

  // 1. Sliding window accuracy
  const windowed = history.slice(-config.windowSize);
  const windowCorrect = windowed.filter(a => a.isCorrect).length;
  const windowAccuracy = windowed.length > 0 ? windowCorrect / windowed.length : 0;

  // 2. Consecutive streak analysis
  const recentAnswers = history.slice(-Math.max(config.correctStepThreshold, config.incorrectStepThreshold));
  let streak = 0;
  const firstInStreak = recentAnswers[0]?.isCorrect;
  for (const a of recentAnswers) {
    if (a.isCorrect === firstInStreak) streak++;
    else break;
  }

  const isOnCorrectStreak = firstInStreak === true && streak >= config.correctStepThreshold;
  const isOnIncorrectStreak = firstInStreak === false && streak >= config.incorrectStepThreshold;

  // 3. Smooth progression logic
  let targetLevel = currentIdx;

  // Upshift: high accuracy OR strong correct streak
  if (windowAccuracy >= config.upshiftAccuracy || isOnCorrectStreak) {
    targetLevel = Math.min(currentIdx + config.maxJump, 5);
  }
  // Downshift: low accuracy OR strong incorrect streak
  else if (windowAccuracy <= config.downshiftAccuracy || isOnIncorrectStreak) {
    targetLevel = Math.max(currentIdx - config.maxJump, 1);
  }
  // Gradual micro-adjustments based on recent single answer
  else if (history.length >= 1) {
    const lastAnswer = history[history.length - 1];
    if (lastAnswer.isCorrect && windowAccuracy >= 0.6) {
      targetLevel = Math.min(currentIdx + 1, 5);
    } else if (!lastAnswer.isCorrect && windowAccuracy < 0.5) {
      targetLevel = Math.max(currentIdx - 1, 1);
    }
  }

  // Cap — don't jump more than maxJump levels
  const clamped = Math.max(
    Math.max(currentIdx - config.maxJump, 1),
    Math.min(targetLevel, Math.min(currentIdx + config.maxJump, 5)),
  );

  return DIFFICULTY_ORDER[clamped - 1];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Answer Option Randomization — balanced distribution tracking
   ═══════════════════════════════════════════════════════════════════════════ */

export interface AnswerPositionStats {
  /** Tally of how many times each position index was the correct answer */
  positionCounts: number[];     // index → count
  totalQuestions: number;
}

/**
 * Create a fresh position stats tracker (reset between tests).
 * Initialized for up to 6 option positions (A–F).
 */
export function createPositionStats(maxOptions: number = 6): AnswerPositionStats {
  return {
    positionCounts: new Array(maxOptions).fill(0),
    totalQuestions: 0,
  };
}

/**
 * Pick the best position for the correct answer to maintain balanced distribution.
 * Favors the least-used position, with some randomness to avoid predictability.
 */
function pickBalancedPosition(stats: AnswerPositionStats): number {
  const minCount = Math.min(...stats.positionCounts);
  const leastUsedPositions = stats.positionCounts
    .map((count, idx) => ({ count, idx }))
    .filter(p => p.count === minCount)
    .map(p => p.idx);

  // Randomly pick from least-used positions for natural feel
  return leastUsedPositions[Math.floor(Math.random() * leastUsedPositions.length)];
}

/**
 * Check if a recent sequence of correct-answer positions looks suspicious.
 * Returns true if the sequence shows an obvious pattern (same pos >60% in last 5).
 */
export function detectPositionPattern(stats: AnswerPositionStats, recentWindow: number = 5): boolean {
  const recent = stats.positionCounts.slice(-recentWindow);
  if (recent.length < recentWindow) return false;
  const maxInWindow = Math.max(...recent);
  return maxInWindow > Math.ceil(recentWindow * 0.6);
}

/**
 * Shuffle answer options while tracking where the correct answer lands.
 *
 * Returns:
 *   - shuffledOptions: string[] — the options in their new order
 *   - newCorrectIdx: number — the index of the correct answer in the shuffled array
 *   - updatedStats: AnswerPositionStats — updated with the chosen position
 */
export function shuffleOptionsWithTracking(
  originalOptions: string[],
  correctIdx: number,
  stats: AnswerPositionStats,
): {
  shuffledOptions: string[];
  newCorrectIdx: number;
  updatedStats: AnswerPositionStats;
  /** Maps displayed option index → original option index */
  displayToOriginal: number[];
} {
  if (originalOptions.length <= 2) {
    // True-false or very few options: just do a simple coin-flip
    const shouldSwap = Math.random() > 0.5;
    const shuffled = shouldSwap ? [...originalOptions].reverse() : [...originalOptions];
    const newCorrect = shouldSwap ? (correctIdx === 0 ? 1 : 0) : correctIdx;
    return { shuffledOptions: shuffled, newCorrectIdx: newCorrect, updatedStats: stats };
  }

  // Pair each option with an index, shuffle the pairs
  const labeled = originalOptions.map((opt, i) => ({
    opt,
    isCorrect: i === correctIdx,
    originalIdx: i,
  }));

  // Fisher-Yates shuffle
  const shuffled = [...labeled];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Find where the correct answer landed
  const newCorrectIdxShuffled = shuffled.findIndex(s => s.isCorrect);

  // Check if the position needs rebalancing — clamp to current options length
  // to avoid out-of-bounds on questions with fewer than 6 options
  const optionCount = shuffled.length;
  const balancedPos = Math.min(pickBalancedPosition(stats), optionCount - 1);

  // If the natural shuffle placed it in an overused position, swap to a balanced one
  let finalShuffled = shuffled;
  let finalCorrectIdx = newCorrectIdxShuffled;

  if (stats.totalQuestions >= 3 && newCorrectIdxShuffled !== balancedPos) {
    const thresholdOveruse = Math.ceil(stats.totalQuestions * 0.35);
    if (stats.positionCounts[newCorrectIdxShuffled] >= thresholdOveruse) {
      // Swap the correct answer into the balanced position
      const correctItem = shuffled[newCorrectIdxShuffled];
      const swapItem = shuffled[balancedPos];
      finalShuffled = [...shuffled];
      finalShuffled[newCorrectIdxShuffled] = swapItem;
      finalShuffled[balancedPos] = correctItem;
      finalCorrectIdx = balancedPos;
    }
  }

  // Update stats
  const updatedStats: AnswerPositionStats = {
    positionCounts: [...stats.positionCounts],
    totalQuestions: stats.totalQuestions + 1,
  };
  updatedStats.positionCounts[finalCorrectIdx] = (updatedStats.positionCounts[finalCorrectIdx] || 0) + 1;

  // Build display-to-original index mapping
  const displayToOriginal: number[] = finalShuffled.map(s => s.originalIdx);

  return {
    shuffledOptions: finalShuffled.map(s => s.opt),
    newCorrectIdx: finalCorrectIdx,
    updatedStats,
    displayToOriginal,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Question Selection Algorithm — Weighted scoring
   ═══════════════════════════════════════════════════════════════════════════ */

export interface QuestionSelectionWeights {
  domainWeaknessWeight: number;      // how much to weight weak domains (0-1)
  difficultyProgressionWeight: number; // how much to weight correct difficulty level
  questionFreshnessWeight: number;   // how much to avoid recently seen questions
  previousPerformanceWeight: number; // how much to weight questions from weaker domains
}

export const DEFAULT_WEIGHTS: QuestionSelectionWeights = {
  domainWeaknessWeight: 0.4,
  difficultyProgressionWeight: 0.3,
  questionFreshnessWeight: 0.2,
  previousPerformanceWeight: 0.1,
};

export interface DomainPerformance {
  domainId: number;
  accuracy: number;  // 0–100
  questionsAttempted: number;
  correctAnswers: number;
}

export interface QuestionSelectorItem {
  question: any;
  domainAccuracy: number;    // 0–100
  difficultyValue: number;   // 1–5
  timesSeenRecently: number; // how many times this question appeared recently
  isInWeakDomain: boolean;
}

/**
 * Score a question for selection using a weighted algorithm.
 * Higher score = more likely to be selected.
 */
function scoreQuestion(
  item: QuestionSelectorItem,
  targetDifficulty: number,
  weights: QuestionSelectionWeights,
): number {
  // Domain weakness score: higher for weaker domains (inverted accuracy)
  const domainScore = (100 - item.domainAccuracy) / 100 * weights.domainWeaknessWeight;

  // Difficulty progression score: closer to target = higher
  const diffDiff = Math.abs(item.difficultyValue - targetDifficulty);
  const difficultyScore = (1 - diffDiff / 4) * weights.difficultyProgressionWeight;

  // Freshness penalty: recently seen questions get lower scores
  const freshnessScore = Math.max(0, 1 - item.timesSeenRecently * 0.5) * weights.questionFreshnessWeight;

  // Previous performance bonus: questions from weak domains get a small boost
  const perfBonus = item.isInWeakDomain ? weights.previousPerformanceWeight * 1.5 : weights.previousPerformanceWeight * 0.5;

  return domainScore + difficultyScore + freshnessScore + perfBonus;
}

/**
 * Select the best question from a pool using weighted scoring.
 * Includes some randomness to prevent identical test sessions.
 */
export function selectWeightedQuestion(
  pool: any[],
  domainPerformance: DomainPerformance[],
  targetDifficulty: AdaptiveDifficulty,
  recentQuestionIds: Set<string>,
  weights: QuestionSelectionWeights = DEFAULT_WEIGHTS,
): any | null {
  if (pool.length === 0) return null;

  const targetVal = DIFFICULTY_VALUES[targetDifficulty];

  // Build performance lookup
  const perfMap = new Map<number, DomainPerformance>();
  for (const dp of domainPerformance) {
    perfMap.set(dp.domainId, dp);
  }

  // Score each question
  const scored = pool.map(q => {
    const dp = perfMap.get(q.domainId);
    const accuracy = dp ? dp.accuracy : 50;
    const questionsAttempted = dp ? dp.questionsAttempted : 0;
    const isWeak = accuracy < 60;

    // Difficulty from question data: map to value
    let diffValue = 3; // default medium
    if (q.difficulty === 'beginner' || q.difficulty === 'easy') diffValue = DIFFICULTY_VALUES[q.difficulty] || 2;
    else if (q.difficulty === 'medium') diffValue = 3;
    else if (q.difficulty === 'hard' || q.difficulty === 'expert') diffValue = DIFFICULTY_VALUES[q.difficulty] || 4;

    const freshness = recentQuestionIds.has(q.id) ? 1 : 0;

    const item: QuestionSelectorItem = {
      question: q,
      domainAccuracy: accuracy,
      difficultyValue: diffValue,
      timesSeenRecently: freshness,
      isInWeakDomain: isWeak,
    };

    return {
      question: q,
      score: scoreQuestion(item, targetVal, weights),
      isWeak,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Pick from top candidates with some randomness (top 3 or 20%, whichever is larger)
  const topN = Math.max(3, Math.ceil(scored.length * 0.2));
  const topCandidates = scored.slice(0, topN);

  // Weighted random selection from top candidates
  const totalScore = topCandidates.reduce((s, c) => s + c.score, 0);
  if (totalScore <= 0) {
    return topCandidates[0]?.question || null;
  }

  let rand = Math.random() * totalScore;
  for (const candidate of topCandidates) {
    rand -= candidate.score;
    if (rand <= 0) return candidate.question;
  }

  return topCandidates[topCandidates.length - 1]?.question || null;
}

/**
 * Build the question pool for a test session using the selection algorithm.
 */
export function buildAdaptiveQuestionPool(
  allQuestions: any[],
  domainPerformance: DomainPerformance[],
  targetDifficulty: AdaptiveDifficulty,
  count: number,
  recentQuestionIds: Set<string>,
  recentDomainIds: number[] = [],
): any[] {
  const selected: any[] = [];
  const usedIds = new Set(recentQuestionIds);

  // Balance domains: ensure weak domains get extra representation
  const weakDomains = domainPerformance
    .filter(dp => dp.accuracy < 60 && dp.questionsAttempted > 0)
    .map(dp => dp.domainId);

  // Priority 1: Fill from weak domains first
  if (weakDomains.length > 0) {
    const weakPool = allQuestions.filter(q =>
      weakDomains.includes(q.domainId) &&
      !usedIds.has(q.id) &&
      q.type !== 'case-study',
    );

    const weakCount = Math.min(Math.ceil(count * 0.3), weakPool.length);
    for (let i = 0; i < weakCount; i++) {
      const q = selectWeightedQuestion(
        weakPool.filter(q => !usedIds.has(q.id)),
        domainPerformance,
        targetDifficulty,
        usedIds,
      );
      if (q) {
        selected.push(q);
        usedIds.add(q.id);
      }
    }
  }

  // Priority 2: Fill remaining from full pool
  const remaining = count - selected.length;
  if (remaining > 0) {
    const remainingPool = allQuestions.filter(q => !usedIds.has(q.id) && q.type !== 'case-study');
    for (let i = 0; i < remaining; i++) {
      const q = selectWeightedQuestion(
        remainingPool.filter(q => !usedIds.has(q.id)),
        domainPerformance,
        targetDifficulty,
        usedIds,
      );
      if (q) {
        selected.push(q);
        usedIds.add(q.id);
      }
    }
  }

  // Add a case study if there's room and any exist
  const caseStudies = allQuestions.filter(q => q.type === 'case-study');
  if (caseStudies.length > 0 && selected.length < count + 3) {
    selected.push(caseStudies[Math.floor(Math.random() * caseStudies.length)]);
  }

  return shuffleArray(selected);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Adaptive Learning Insights Generator
   ═══════════════════════════════════════════════════════════════════════════ */

export interface AdaptiveInsight {
  type: 'strength' | 'weakness' | 'trend' | 'recommendation';
  message: string;
  domainId?: number;
}

export function generateAdaptiveInsights(
  domainPerformance: { domainId: number; name: string; accuracy: number; correct: number; total: number }[],
  difficultyAnalysis: { difficulty: string; accuracy: number; correct: number; total: number }[],
): AdaptiveInsight[] {
  const insights: AdaptiveInsight[] = [];

  // Strength insights
  const strengths = domainPerformance.filter(d => d.accuracy >= 75 && d.total >= 2);
  for (const s of strengths) {
    insights.push({
      type: 'strength',
      message: `You perform well in ${s.name} (${s.accuracy}% accuracy).`,
      domainId: s.domainId,
    });
  }

  // Weakness insights
  const weaknesses = domainPerformance.filter(d => d.accuracy < 60 && d.total >= 1);
  for (const w of weaknesses) {
    const msg = w.total === 0
      ? `No questions attempted in ${w.name} yet — review foundational concepts.`
      : `Focus on ${w.name} (${w.accuracy}% — needs improvement).`;
    insights.push({
      type: 'weakness',
      message: msg,
      domainId: w.domainId,
    });
  }

  // Difficulty trend insights
  if (difficultyAnalysis.length > 0) {
    const sortedByDiff = [...difficultyAnalysis].sort(
      (a, b) => (DIFFICULTY_VALUES[a.difficulty as AdaptiveDifficulty] || 0) -
        (DIFFICULTY_VALUES[b.difficulty as AdaptiveDifficulty] || 0),
    );
    const hardest = sortedByDiff[sortedByDiff.length - 1];
    if (hardest && hardest.total >= 1) {
      if (hardest.accuracy < 50) {
        insights.push({
          type: 'trend',
          message: `You consistently miss ${hardest.difficulty}-level questions. Focus on understanding core concepts before attempting advanced scenarios.`,
        });
      } else if (hardest.accuracy >= 80) {
        insights.push({
          type: 'trend',
          message: `You handle ${hardest.difficulty}-level questions well — you are ready for more advanced challenges.`,
        });
      }
    }
  }

  // General recommendation
  if (weaknesses.length > 0 && strengths.length > 0) {
    const topWeak = weaknesses[0];
    const topStrong = strengths[0];
    insights.push({
      type: 'recommendation',
      message: `You are strong in ${topStrong.name} but need reinforcement in ${topWeak.name}. Try domain-focused practice for ${topWeak.name}.`,
      domainId: topWeak.domainId,
    });
  } else if (weaknesses.length === 0 && domainPerformance.some(d => d.total >= 5)) {
    insights.push({
      type: 'recommendation',
      message: 'Strong performance across all domains — consider scheduling your CISSP exam.',
    });
  }

  return insights;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shared Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function filterQuestionsByDifficulty(
  questions: any[],
  difficulty: AdaptiveDifficulty,
): any[] {
  const diffValue = DIFFICULTY_VALUES[difficulty];
  // Get questions at or near this difficulty
  const tolerance = 1;
  return questions.filter(q => {
    const qVal = q.difficulty === 'beginner' ? 1 :
      q.difficulty === 'easy' ? 2 :
      q.difficulty === 'medium' ? 3 :
      q.difficulty === 'hard' ? 4 :
      q.difficulty === 'expert' ? 5 : 3;
    return Math.abs(qVal - diffValue) <= tolerance;
  });
}

export function calculateReadinessScore(
  domainAnalytics: { accuracy: number; questionsAttempted: number }[],
): number {
  if (domainAnalytics.length === 0) return 0;
  const totalAccuracy = domainAnalytics.reduce((sum, d) => sum + d.accuracy, 0);
  const avgAccuracy = totalAccuracy / domainAnalytics.length;
  const totalQuestions = domainAnalytics.reduce((sum, d) => sum + d.questionsAttempted, 0);
  const coverageFactor = Math.min(totalQuestions / 100, 1);
  return Math.round(avgAccuracy * coverageFactor * 0.8 + avgAccuracy * 0.2);
}

export function calculateConfidenceScore(
  totalCorrect: number,
  totalQuestions: number,
  averageTimePerQuestion: number,
): number {
  if (totalQuestions === 0) return 0;
  const accuracy = totalCorrect / totalQuestions;
  const timeFactor = Math.max(0, 1 - (averageTimePerQuestion - 30) / 120);
  return Math.round((accuracy * 0.7 + timeFactor * 0.3) * 100);
}

export function estimatePassProbability(readinessScore: number, confidenceScore: number): number {
  return Math.round((readinessScore * 0.6 + confidenceScore * 0.4));
}

export function recommendExamDate(score: number): string {
  if (score >= 80) return 'You are ready! Schedule your exam within 2 weeks.';
  if (score >= 60) return 'Recommended: Schedule in 4-6 weeks with focused study.';
  if (score >= 40) return 'Recommended: Schedule in 2-3 months with consistent practice.';
  return 'Focus on fundamentals for at least 3-4 months before scheduling.';
}
