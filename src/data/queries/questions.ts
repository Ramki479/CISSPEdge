import { db } from '../db';
import type { Question } from '../../types';

/**
 * Load all questions from IndexedDB, or return null if not yet seeded.
 */
export async function getAllQuestions(): Promise<Question[]> {
  try {
    return await db.questions.toArray();
  } catch {
    return [];
  }
}

/**
 * Load questions filtered by domain ID.
 */
export async function getQuestionsByDomain(domainId: number): Promise<Question[]> {
  try {
    return await db.questions.where('domainId').equals(domainId).toArray();
  } catch {
    return [];
  }
}

/**
 * Seed questions into IndexedDB if the table is empty.
 */
export async function seedQuestionsIfNeeded(): Promise<void> {
  try {
    const count = await db.questions.count();
    if (count > 0) return;

    // Dynamically import the large question bank — this keeps it out of the
    // main bundle and loads it only when seeding (first visit or after clear).
    const [bankModule, enhancedModule] = await Promise.all([
      import('../questionBank'),
      import('../enhancedQuestions'),
    ]);

    const allQuestions: Question[] = [
      ...bankModule.questions,
      ...enhancedModule.enhancedQuestions,
    ];

    await db.questions.bulkAdd(allQuestions);
  } catch {
    // Non-critical — questions table may be empty on first visit
  }
}
