import Dexie, { type Table } from 'dexie';
import type { UserProgress, TestSession, FlashCard, StudyNote, StudyPlan, DailyChallenge, UserAnswer } from '../types';

class CisspDatabase extends Dexie {
  progress!: Table<UserProgress>;
  testSessions!: Table<TestSession>;
  answers!: Table<UserAnswer>;
  flashcards!: Table<FlashCard>;
  notes!: Table<StudyNote>;
  studyPlans!: Table<StudyPlan>;
  dailyChallenges!: Table<DailyChallenge>;

  constructor() {
    super('CISSP_OFFLINE');
    this.version(1).stores({
      progress: '++id',
      testSessions: 'id, mode, domainId, startedAt, completedAt',
      answers: 'questionId, testSessionId, timestamp',
      flashcards: 'id, domainId, bookmarked, nextReviewDue',
      notes: 'id, domainId, createdAt',
      studyPlans: 'id, targetDate',
      dailyChallenges: 'id, date, domainId',
    });
  }
}

export const db = new CisspDatabase();

export async function initializeUserProgress(level: UserProgress['level']): Promise<UserProgress> {
  const existing = await db.progress.toArray();
  if (existing.length > 0) {
    return existing[0];
  }
  const progress: UserProgress = {
    level,
    totalXp: 0,
    streak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    badges: [],
    completedOnboarding: true,
    onboardingDate: Date.now(),
  };
  await db.progress.add(progress);
  return progress;
}

export async function getUserProgress(): Promise<UserProgress | null> {
  const all = await db.progress.toArray();
  return all.length > 0 ? all[0] : null;
}

export async function updateUserProgress(updates: Partial<UserProgress>): Promise<void> {
  const current = await getUserProgress();
  if (current) {
    await db.progress.update(current as any, updates);
  }
}

export async function getDomainAnalytics(domainId: number) {
  const sessions = await db.testSessions
    .filter(s => s.domainId === domainId || s.domainId === undefined)
    .toArray();

  let questionsAttempted = 0;
  let correctAnswers = 0;
  let totalTimeSpent = 0;

  for (const session of sessions) {
    for (const answer of session.answers) {
      questionsAttempted++;
      if (answer.isCorrect) correctAnswers++;
      totalTimeSpent += answer.timeSpent;
    }
  }

  const accuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;
  const strengthScore = accuracy;
  let classification: 'critical' | 'weak' | 'moderate' | 'strong' = 'moderate';
  if (accuracy >= 80) classification = 'strong';
  else if (accuracy >= 60) classification = 'moderate';
  else if (accuracy >= 40) classification = 'weak';
  else classification = 'critical';

  return { domainId, questionsAttempted, correctAnswers, totalTimeSpent, accuracy, strengthScore, classification };
}

export async function getAllDomainAnalytics() {
  const domainIds = [1, 2, 3, 4, 5, 6, 7, 8];
  const results = await Promise.all(domainIds.map(id => getDomainAnalytics(id)));
  return results;
}
