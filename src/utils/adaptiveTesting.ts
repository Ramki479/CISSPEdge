import type { PreparationLevel, UserAnswer } from '../types';

export interface AdaptiveConfig {
  initialDifficulty: 'easy' | 'medium' | 'hard';
  difficultyThreshold: number;
  questionsPerTest: number;
}

export function getAdaptiveConfig(level: PreparationLevel): AdaptiveConfig {
  switch (level) {
    case 'beginner':
      return { initialDifficulty: 'easy', difficultyThreshold: 0.65, questionsPerTest: 10 };
    case 'intermediate':
      return { initialDifficulty: 'medium', difficultyThreshold: 0.55, questionsPerTest: 10 };
    case 'expert':
      return { initialDifficulty: 'hard', difficultyThreshold: 0.45, questionsPerTest: 10 };
  }
}

export function calculateDynamicDifficulty(
  history: UserAnswer[],
  currentDifficulty: 'easy' | 'medium' | 'hard',
  config: AdaptiveConfig
): 'easy' | 'medium' | 'hard' {
  if (history.length < 3) return currentDifficulty;

  const recentAnswers = history.slice(-5);
  const recentCorrect = recentAnswers.filter(a => a.isCorrect).length;
  const recentAccuracy = recentCorrect / recentAnswers.length;

  if (recentAccuracy > config.difficultyThreshold + 0.15) {
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  } else if (recentAccuracy < config.difficultyThreshold - 0.15) {
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }
  return currentDifficulty;
}

export function calculateReadinessScore(
  domainAnalytics: { accuracy: number; questionsAttempted: number }[]
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
  averageTimePerQuestion: number
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

export const difficultyLevels = ['easy', 'medium', 'hard'] as const;
