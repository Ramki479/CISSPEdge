import type { Badge, UserProgress } from '../types';

export const BADGES: Badge[] = [
  { id: 'first-test', name: 'First Steps', description: 'Complete your first practice test', icon: '🎯', tier: 'bronze', requirement: { type: 'tests-completed', value: 1 } },
  { id: 'perfect-score', name: 'Perfect Score', description: 'Score 100% on a practice test', icon: '💯', tier: 'gold', requirement: { type: 'perfect-test', value: 1 } },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day study streak', icon: '🔥', tier: 'silver', requirement: { type: 'streak', value: 7 } },
  { id: 'streak-30', name: 'Month Master', description: 'Maintain a 30-day study streak', icon: '💪', tier: 'gold', requirement: { type: 'streak', value: 30 } },
  { id: 'domain-master', name: 'Domain Master', description: 'Score 90%+ in any domain', icon: '🏆', tier: 'gold', requirement: { type: 'domain-mastery', value: 90 } },
  { id: 'all-domains', name: 'Omniscient', description: 'Attempt questions from all 8 domains', icon: '🧠', tier: 'platinum', requirement: { type: 'all-domains', value: 8 } },
  { id: '100-questions', name: 'Century Mark', description: 'Answer 100 questions total', icon: '📚', tier: 'bronze', requirement: { type: 'total-questions', value: 100 } },
  { id: '500-questions', name: 'Scholar', description: 'Answer 500 questions total', icon: '🎓', tier: 'silver', requirement: { type: 'total-questions', value: 500 } },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Complete a test with avg < 30s per question', icon: '⚡', tier: 'silver', requirement: { type: 'speed', value: 30 } },
  { id: 'platinum-prep', name: 'Platinum Prep', description: 'Reach 90% readiness score', icon: '💎', tier: 'platinum', requirement: { type: 'readiness', value: 90 } },
];

const XP_PER_CORRECT = 10;
const XP_PER_STREAK_DAY = 5;
const XP_BONUS_80 = 50;
const XP_BONUS_100 = 100;

export function calculateXpForAnswer(isCorrect: boolean): number {
  return isCorrect ? XP_PER_CORRECT : 0;
}

export function calculateStreakBonus(streakDays: number): number {
  return Math.min(streakDays * XP_PER_STREAK_DAY, 50);
}

export function calculateTestBonus(percentage: number): number {
  if (percentage === 100) return XP_BONUS_100;
  if (percentage >= 80) return XP_BONUS_80;
  return 0;
}

export function checkNewBadges(progress: UserProgress, stats: {
  testsCompleted: number;
  perfectTest: boolean;
  domainMastery: number[];
  domainsAttempted: Set<number>;
  totalQuestions: number;
  avgSpeed: number;
  readinessScore: number;
}): string[] {
  const newBadges: string[] = [];

  for (const badge of BADGES) {
    if (progress.badges.includes(badge.id)) continue;
    let earned = false;
    switch (badge.requirement.type) {
      case 'tests-completed':
        earned = stats.testsCompleted >= badge.requirement.value;
        break;
      case 'perfect-test':
        earned = stats.perfectTest;
        break;
      case 'streak':
        earned = progress.streak >= badge.requirement.value;
        break;
      case 'domain-mastery':
        earned = stats.domainMastery.some(s => s >= badge.requirement.value);
        break;
      case 'all-domains':
        earned = stats.domainsAttempted.size >= badge.requirement.value;
        break;
      case 'total-questions':
        earned = stats.totalQuestions >= badge.requirement.value;
        break;
      case 'speed':
        earned = stats.avgSpeed <= badge.requirement.value;
        break;
      case 'readiness':
        earned = stats.readinessScore >= badge.requirement.value;
        break;
    }
    if (earned) newBadges.push(badge.id);
  }
  return newBadges;
}

export const DAILY_CHALLENGES = [
  { title: 'Risk Management Review', description: 'Answer 5 security and risk management questions', questionCount: 5, domainId: 1, xpReward: 25 },
  { title: 'Asset Security Quick Test', description: 'Answer 5 asset security questions', questionCount: 5, domainId: 2, xpReward: 25 },
  { title: 'Architecture Challenge', description: 'Answer 5 security architecture questions', questionCount: 5, domainId: 3, xpReward: 25 },
  { title: 'Network Security Quiz', description: 'Answer 5 network security questions', questionCount: 5, domainId: 4, xpReward: 25 },
  { title: 'IAM Sprint', description: 'Answer 5 IAM questions as fast as possible', questionCount: 5, domainId: 5, xpReward: 25 },
  { title: 'Assessment Test', description: 'Answer 5 security assessment questions', questionCount: 5, domainId: 6, xpReward: 25 },
  { title: 'SecOps Challenge', description: 'Answer 5 security operations questions', questionCount: 5, domainId: 7, xpReward: 25 },
  { title: 'Software Security Review', description: 'Answer 5 software development security questions', questionCount: 5, domainId: 8, xpReward: 25 },
  { title: 'Mixed Domain Challenge', description: 'Answer 10 questions from random domains', questionCount: 10, domainId: 0, xpReward: 50 },
  { title: 'Speed Round', description: 'Answer 5 questions in under 3 minutes', questionCount: 5, domainId: 0, xpReward: 40 },
];

export function getDailyChallenge(): { title: string; description: string; questionCount: number; domainId: number; xpReward: number } | null {
  const dayOfYear = new Date().getDate() + new Date().getMonth() * 31;
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}
