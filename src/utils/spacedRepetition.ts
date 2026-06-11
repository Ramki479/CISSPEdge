/**
 * SM-2 Spaced Repetition Algorithm
 * Implements the SuperMemo SM-2 algorithm for scheduling flashcard reviews.
 *
 * Rating scale (0-5):
 *   0 - Complete blackout (forgot entirely)
 *   1 - Incorrect, but upon seeing the answer, remembered
 *   2 - Incorrect, but the answer seemed easy to recall
 *   3 - Correct with serious difficulty
 *   4 - Correct after hesitation
 *   5 - Perfect response
 */

import type { FlashCard, ReviewRating } from '../types';

interface Sm2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDue: number;
}

function calculateSm2(
  rating: ReviewRating,
  currentEF: number,
  currentInterval: number,
  currentRepetitions: number
): Sm2Result {
  let ef = currentEF;
  let interval: number;
  let repetitions: number;

  if (rating >= 3) {
    // Correct response
    if (currentRepetitions === 0) {
      interval = 1;
    } else if (currentRepetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * ef);
    }
    repetitions = currentRepetitions + 1;
  } else {
    // Incorrect response — reset
    repetitions = 0;
    interval = 1;
  }

  // Update easiness factor
  ef = ef + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (ef < 1.3) ef = 1.3;

  return {
    easinessFactor: Math.round(ef * 100) / 100,
    interval,
    repetitions,
    nextReviewDue: Date.now() + interval * 24 * 60 * 60 * 1000,
  };
}

/**
 * Process a flashcard review rating and return updated card fields.
 */
export function processReview(card: FlashCard, rating: ReviewRating): Partial<FlashCard> {
  const result = calculateSm2(
    rating,
    card.easinessFactor || 2.5,
    card.interval || 0,
    card.repetitions || 0
  );

  return {
    easinessFactor: result.easinessFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewDue: result.nextReviewDue,
    lastReviewed: Date.now(),
    reviewCount: (card.reviewCount || 0) + 1,
  };
}

/**
 * Get all flashcards that are due for review (nextReviewDue is in the past or not set).
 */
export function getDueCards(cards: FlashCard[]): FlashCard[] {
  const now = Date.now();
  return cards.filter(c => !c.nextReviewDue || c.nextReviewDue <= now);
}

/**
 * Sort cards by priority: overdue first, then by easiness factor (hardest first).
 */
export function sortByPriority(cards: FlashCard[]): FlashCard[] {
  return [...cards].sort((a, b) => {
    // Cards without a review date (new) come first
    if (!a.nextReviewDue && !b.nextReviewDue) return 0;
    if (!a.nextReviewDue) return -1;
    if (!b.nextReviewDue) return 1;

    // Overdue cards first
    const now = Date.now();
    const aOverdue = a.nextReviewDue <= now;
    const bOverdue = b.nextReviewDue <= now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Among overdue, highest urgency (furthest past due) first
    if (aOverdue && bOverdue) {
      return a.nextReviewDue - b.nextReviewDue;
    }

    // Among future cards, lowest easiness factor first (hardest)
    return (a.easinessFactor || 2.5) - (b.easinessFactor || 2.5);
  });
}

/**
 * Get review statistics for the spaced repetition system.
 */
export function getSpacedRepetitionStats(cards: FlashCard[]) {
  const now = Date.now();
  const dueCards = cards.filter(c => !c.nextReviewDue || c.nextReviewDue <= now);
  const upcomingCards = cards.filter(c => c.nextReviewDue && c.nextReviewDue > now);
  const newCards = cards.filter(c => !c.nextReviewDue);
  const masteredCards = cards.filter(c => c.repetitions >= 5 && c.easinessFactor >= 2.5);

  return {
    totalCards: cards.length,
    dueToday: dueCards.length,
    upcoming: upcomingCards.length,
    newCards: newCards.length,
    mastered: masteredCards.length,
    averageEF: cards.length > 0
      ? Math.round(cards.reduce((s, c) => s + (c.easinessFactor || 2.5), 0) / cards.length * 100) / 100
      : 2.5,
  };
}
