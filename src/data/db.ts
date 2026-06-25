import Dexie, { type Table } from 'dexie';
import type { UserProgress, TestSession, FlashCard, StudyNote, StudyPlan, DailyChallenge, UserAnswer, Question } from '../types';

class CisspDatabase extends Dexie {
  progress!: Table<UserProgress>;
  testSessions!: Table<TestSession>;
  answers!: Table<UserAnswer>;
  flashcards!: Table<FlashCard>;
  notes!: Table<StudyNote>;
  studyPlans!: Table<StudyPlan>;
  dailyChallenges!: Table<DailyChallenge>;
  questions!: Table<Question>;

  constructor() {
    super('CISSP_OFFLINE');
    this.version(3).stores({
      progress: '++id',
      testSessions: 'id, mode, domainId, startedAt, completedAt',
      answers: 'questionId, testSessionId, topicId, domainId, timestamp',
      flashcards: 'id, domainId, bookmarked, nextReviewDue',
      notes: 'id, domainId, createdAt',
      studyPlans: 'id, targetDate',
      dailyChallenges: 'id, date, domainId',
      questions: 'id, domainId, type, difficulty',
    });
  }
}

let _db: CisspDatabase | null = null;
let _dbError: Error | null = null;

/**
 * Lazily initialises the Dexie database instance.
 *
 * IMPORTANT: We do NOT create the instance at module level because
 * Dexie's constructor accesses IndexedDB synchronously. If IndexedDB is
 * unavailable (private browsing, permissions, etc.), the module import
 * itself would crash, preventing React from ever mounting.  By deferring
 * creation to first use, we let React mount first and handle any DB
 * error gracefully inside the error boundary.
 *
 * Instead of throwing synchronously, this returns null on failure so
 * callers can handle the missing-DB case gracefully rather than crashing.
 */
export function getDb(): CisspDatabase | null {
  if (_dbError) {
    if (import.meta.env.DEV) console.error('[database] DB init previously failed:', _dbError);
    return null;
  }
  if (_db) return _db;
  try {
    _db = new CisspDatabase();
    return _db;
  } catch (err) {
    _dbError = err instanceof Error ? err : new Error(String(err));
    if (import.meta.env.DEV) console.error('[database] DB init failed:', _dbError);
    return null;
  }
}

/** Convenience reference — safe for use after initialisation. */
export const db: CisspDatabase = new Proxy({} as CisspDatabase, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) {
      // Return a safe no-op proxy for any method call, or undefined for property access
      if (typeof prop === 'string' && (prop === 'then' || prop === 'catch' || prop === 'finally')) {
        return undefined;
      }
      // Return a proxy that safely handles async calls (toArray, add, update, etc.)
      return new Proxy(() => Promise.reject(new Error('Database unavailable')), {
        get(_t, p) {
          if (p === 'then' || p === 'catch' || p === 'finally') return undefined;
          return () => Promise.reject(new Error('Database unavailable'));
        },
      });
    }
    return (instance as any)[prop];
  },
  set(_target, prop, value) {
    const instance = getDb();
    if (instance) {
      (instance as any)[prop] = value;
    }
    return true;
  },
});
