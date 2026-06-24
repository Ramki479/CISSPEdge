import type { DomainAnalytics, UserAnswer, DomainClassification } from '../types';
import { domains } from '../data/questionBank';

export function calculateDomainAnalytics(
  domainId: number,
  answers: UserAnswer[],
  questionDomainMap?: Map<string, number>,
): DomainAnalytics {
  let questionsAttempted = 0;
  let correctAnswers = 0;
  let totalTimeSpent = 0;

  for (const answer of answers) {
    // If we have a domain mapping, only count answers belonging to this domain
    if (questionDomainMap) {
      const answerDomain = questionDomainMap.get(answer.questionId);
      if (answerDomain !== domainId) continue;
    }
    questionsAttempted++;
    if (answer.isCorrect) correctAnswers++;
    totalTimeSpent += answer.timeSpent;
  }

  const accuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;
  const strengthScore = accuracy;

  let classification: DomainClassification = 'moderate';
  if (accuracy >= 80) classification = 'strong';
  else if (accuracy >= 60) classification = 'moderate';
  else if (accuracy >= 40) classification = 'weak';
  else classification = 'critical';

  return {
    domainId,
    questionsAttempted,
    correctAnswers,
    totalTimeSpent,
    accuracy,
    strengthScore,
    classification,
  };
}

export function calculateOverallStats(domainAnalytics: DomainAnalytics[]) {
  const totalAttempted = domainAnalytics.reduce((s, d) => s + d.questionsAttempted, 0);
  const totalCorrect = domainAnalytics.reduce((s, d) => s + d.correctAnswers, 0);
  const totalTime = domainAnalytics.reduce((s, d) => s + d.totalTimeSpent, 0);

  const overallPercentage = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  const readinessScore = domainAnalytics.length > 0
    ? Math.round(domainAnalytics.reduce((s, d) => s + d.strengthScore, 0) / domainAnalytics.length)
    : 0;
  const passProbability = Math.min(95, Math.round(readinessScore * 0.9 + overallPercentage * 0.1));

  const weaknesses = domainAnalytics
    .filter(d => d.classification === 'weak' || d.classification === 'critical')
    .map(d => domains.find(dom => dom.id === d.domainId)?.name || '');

  const strengths = domainAnalytics
    .filter(d => d.classification === 'strong')
    .map(d => domains.find(dom => dom.id === d.domainId)?.name || '');

  return {
    totalAttempted,
    totalCorrect,
    totalTime,
    overallPercentage: Math.round(overallPercentage),
    readinessScore,
    passProbability,
    weaknesses,
    strengths,
  };
}

export function getLearningTrend(domainAnalytics: DomainAnalytics[]) {
  return domainAnalytics.map(d => ({
    domain: domains.find(dom => dom.id === d.domainId)?.shortName || '',
    accuracy: Math.round(d.accuracy),
    attempted: d.questionsAttempted,
    time: Math.round(d.totalTimeSpent / 60),
  }));
}

export function getHeatmapData(domainAnalytics: DomainAnalytics[]) {
  return domainAnalytics.map(d => ({
    domain: domains.find(dom => dom.id === d.domainId)?.name.split(' ').slice(0, 3).join(' ') || '',
    accuracy: Math.round(d.accuracy),
    questions: d.questionsAttempted,
    classification: d.classification,
  }));
}
