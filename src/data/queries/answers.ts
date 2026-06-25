import { db } from '../db';
import { computeTopicAnalyticsFromAnswers, type TopicAnalytics } from '../../utils/topicMapping';
import type { UserAnswer } from '../../types';

/**
 * Load all answers for a given test session from the answers table.
 */
export async function getSessionAnswers(sessionId: string): Promise<UserAnswer[]> {
  return db.answers.where('testSessionId').equals(sessionId).toArray();
}

/**
 * Compute per-topic analytics from all stored answers.
 *
 * This gives REAL topic-level accuracy (not estimated from domain data)
 * by using the concepts and topicId that were stored at answer time.
 *
 * Returns an array of { domainId, topicId, topicTitle, questionsAttempted,
 * correctAnswers, accuracy } sorted weakest-first.
 */
export async function fetchTopicAnalytics(): Promise<TopicAnalytics[]> {
  // Use the indexed topicId column to load only answers with topic data
  const allAnswers = await db.answers.toArray();
  const validAnswers = allAnswers.filter(a => a.topicId);
  return computeTopicAnalyticsFromAnswers(validAnswers);
}

/**
 * Compute per-topic analytics for a specific domain.
 */
export async function fetchTopicAnalyticsByDomain(domainId: number): Promise<TopicAnalytics[]> {
  const allAnswers = await db.answers
    .where('domainId')
    .equals(domainId)
    .toArray();
  const validAnswers = allAnswers.filter(a => a.topicId);
  return computeTopicAnalyticsFromAnswers(validAnswers);
}
