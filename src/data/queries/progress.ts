import { db } from '../db';
import type { UserProgress } from '../../types';

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
    soundEnabled: true,
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
    await db.progress.update((current as UserProgress & { id: number }).id, updates);
  }
}
