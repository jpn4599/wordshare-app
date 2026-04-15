// src/lib/srs.ts — SM-2 Spaced Repetition Algorithm
// Pure functions, no side effects. Portable between Artifact and Supabase versions.

import type { SRSCard } from './types';

/**
 * Create a new SRS card with default values.
 */
export function createSRSCard(userId: string, postId: string): Omit<SRSCard, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    post_id: postId,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review: new Date().toISOString(),
    last_result: null,
  };
}

/**
 * Update an SRS card based on answer quality.
 * 
 * Quality scale (simplified from SM-2):
 *   0 = Total blackout
 *   1 = Incorrect, but recognized after seeing answer
 *   2 = Incorrect, but felt close
 *   3 = Correct, but with significant difficulty
 *   4 = Correct, with some hesitation
 *   5 = Perfect, instant recall
 * 
 * For quiz usage:
 *   correct answer → quality = 4
 *   incorrect answer → quality = 1
 */
export function updateSRSCard(
  card: SRSCard,
  quality: number
): Pick<SRSCard, 'ease_factor' | 'interval_days' | 'repetitions' | 'next_review' | 'last_result'> {
  let { ease_factor, interval_days, repetitions } = card;

  if (quality >= 3) {
    // Correct: increase interval
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 3;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  } else {
    // Incorrect: reset
    repetitions = 0;
    interval_days = 0; // Will be reviewed again soon
  }

  // Update ease factor (minimum 1.3)
  ease_factor = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);

  return {
    ease_factor,
    interval_days,
    repetitions,
    next_review: nextReview.toISOString(),
    last_result: quality >= 3 ? 'correct' : 'incorrect',
  };
}

/**
 * Check if a card is due for review (nextReview <= now).
 */
export function isDueForReview(card: SRSCard): boolean {
  return new Date(card.next_review) <= new Date();
}

/**
 * Calculate urgency score for prioritizing quiz questions.
 * Higher score = should be reviewed sooner.
 * 
 * Factors:
 *   - How overdue the card is (days past next_review)
 *   - Difficulty (lower ease_factor = harder = higher priority)
 *   - Last result (incorrect cards get +5 bonus)
 */
export function getUrgencyScore(card: SRSCard): number {
  const overdueDays =
    (Date.now() - new Date(card.next_review).getTime()) / (1000 * 60 * 60 * 24);
  const difficultyWeight = (3.0 - card.ease_factor) * 2;
  const incorrectBonus = card.last_result === 'incorrect' ? 5 : 0;

  return overdueDays + difficultyWeight + incorrectBonus;
}

/**
 * Classify a card's learning stage.
 */
export type LearningStage = 'new' | 'learning' | 'mastered';

export function getLearningStage(card: SRSCard): LearningStage {
  if (card.repetitions === 0) return 'new';
  if (card.interval_days >= 21) return 'mastered'; // 3+ weeks = mastered
  return 'learning';
}

/**
 * Sort cards for quiz: due cards first (by urgency), then random non-due.
 */
export function sortCardsForQuiz(cards: SRSCard[]): SRSCard[] {
  const due = cards.filter(isDueForReview).sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
  const notDue = cards.filter((c) => !isDueForReview(c)).sort(() => Math.random() - 0.5);
  return [...due, ...notDue];
}
