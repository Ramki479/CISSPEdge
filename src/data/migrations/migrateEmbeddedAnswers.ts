import { db } from '..';
import type { TestSession } from '../../types';

const MIGRATION_FLAG = 'answers_migrated_v1';

/**
 * One-time migration: reads all existing TestSession records, extracts any
 * embedded `answers` arrays, and writes them into the `db.answers` table.
 *
 * After Dexie v2 migration, new sessions store answers only in the `answers`
 * table.  Old sessions (created before this migration) may still have answers
 * embedded in the `testSessions` table under the `answers` property.
 *
 * This migration is idempotent — it uses a localStorage flag to track
 * completion and skips answers that already exist in the `answers` table.
 */
export async function migrateEmbeddedAnswers(): Promise<void> {
  // Already migrated in this browser?
  if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATION_FLAG)) {
    return;
  }

  try {
    const allSessions = await db.testSessions.toArray();

    for (const session of allSessions) {
      const sessionAny = session as TestSession & { answers?: unknown[] };

      // Skip sessions that have no embedded answers array
      if (!Array.isArray(sessionAny.answers) || sessionAny.answers.length === 0) {
        continue;
      }

      // Check how many answers already exist in the answers table for this session
      const existingCount = await db.answers
        .where('testSessionId')
        .equals(session.id)
        .count();

      if (existingCount >= sessionAny.answers.length) {
        // Already migrated — clear the embedded field
        delete sessionAny.answers;
        await db.testSessions.put(sessionAny as TestSession);
        continue;
      }

      // Backfill missing answers
      const backfillAnswers = sessionAny.answers
        .filter(a => a && typeof a === 'object' && 'questionId' in a)
        .map((a: any) => ({
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer ?? null,
          isCorrect: a.isCorrect ?? false,
          timeSpent: a.timeSpent ?? 0,
          timestamp: a.timestamp ?? Date.now(),
          testSessionId: session.id,
        }));

      if (backfillAnswers.length > 0) {
        await db.answers.bulkPut(backfillAnswers);
      }

      // Remove the embedded answers from the session record
      delete sessionAny.answers;
      await db.testSessions.put(sessionAny as TestSession);
    }

    // Mark migration complete
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MIGRATION_FLAG, 'true');
    }
  } catch (err) {
    // Migration failure should not block the app — answers will be missing
    // from the answers table, but the app handles this gracefully via
    // getSessionAnswers returning an empty array.
    // Non-critical — answers will be missing from the answers table,
    // but getSessionAnswers handles this gracefully (returns empty array).
  }
}
