/**
 * questionLoader.ts
 *
 * Lazy-loads the question bank from the static JS bundle into IndexedDB
 * on first visit, then serves from IndexedDB on all subsequent calls.
 *
 * This keeps ~300KB of question data out of the main JS bundle — it's
 * only loaded via dynamic import() when seeding is needed (first visit
 * or after data reset).
 */

import { db, seedQuestionsIfNeeded } from './database';
import type { Question } from '../types';

/* ─── In-memory guard — prevents double-seeding in the same session ────── */
let _hasSeededThisSession = false;
let _seedingPromise: Promise<void> | null = null;

/**
 * Load all questions from IndexedDB.
 *
 * On the very first call in a session, if the questions table is empty,
 * this will dynamically import the question bank modules and seed
 * IndexedDB before returning. Subsequent calls return immediately
 * from IndexedDB.
 */
export async function loadQuestions(): Promise<Question[]> {
  // Ensure seeding has happened at least once this session
  if (!_hasSeededThisSession) {
    if (!_seedingPromise) {
      _seedingPromise = seedQuestionsIfNeeded()
        .then(() => { _hasSeededThisSession = true; })
        .catch(() => {
          _seedingPromise = null; // Allow retry on next call
        });
    }
    await _seedingPromise;
  }

  // Always read fresh from IndexedDB
  try {
    return await db.questions.toArray();
  } catch {
    return [];
  }
}
