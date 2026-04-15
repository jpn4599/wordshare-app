// src/lib/__tests__/srs.test.ts — Unit tests for SM-2 algorithm
import { describe, it, expect } from 'vitest';
import {
  createSRSCard,
  updateSRSCard,
  isDueForReview,
  getUrgencyScore,
  getLearningStage,
  sortCardsForQuiz,
} from '../srs';
import type { SRSCard } from '../types';

function makeCard(overrides: Partial<SRSCard> = {}): SRSCard {
  return {
    id: 'test-id',
    user_id: 'user-1',
    post_id: 'post-1',
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review: new Date().toISOString(),
    last_result: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('createSRSCard', () => {
  it('creates card with default values', () => {
    const card = createSRSCard('user-1', 'post-1');
    expect(card.ease_factor).toBe(2.5);
    expect(card.interval_days).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.last_result).toBeNull();
  });
});

describe('updateSRSCard', () => {
  it('sets interval to 1 day on first correct answer', () => {
    const card = makeCard({ repetitions: 0 });
    const result = updateSRSCard(card, 4);
    expect(result.interval_days).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.last_result).toBe('correct');
  });

  it('sets interval to 3 days on second correct answer', () => {
    const card = makeCard({ repetitions: 1, interval_days: 1 });
    const result = updateSRSCard(card, 4);
    expect(result.interval_days).toBe(3);
    expect(result.repetitions).toBe(2);
  });

  it('multiplies interval by ease factor on subsequent correct answers', () => {
    const card = makeCard({ repetitions: 2, interval_days: 3, ease_factor: 2.5 });
    const result = updateSRSCard(card, 4);
    expect(result.interval_days).toBe(8); // round(3 * 2.5) = 8
    expect(result.repetitions).toBe(3);
  });

  it('resets on incorrect answer', () => {
    const card = makeCard({ repetitions: 5, interval_days: 30, ease_factor: 2.5 });
    const result = updateSRSCard(card, 1);
    expect(result.interval_days).toBe(0);
    expect(result.repetitions).toBe(0);
    expect(result.last_result).toBe('incorrect');
  });

  it('never decreases ease factor below 1.3', () => {
    let card = makeCard({ ease_factor: 1.4 });
    const result = updateSRSCard(card, 0); // worst quality
    expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
  });

  it('increases ease factor on perfect quality', () => {
    const card = makeCard({ ease_factor: 2.5 });
    const result = updateSRSCard(card, 5);
    expect(result.ease_factor).toBeGreaterThan(2.5);
  });
});

describe('isDueForReview', () => {
  it('returns true for past dates', () => {
    const card = makeCard({
      next_review: new Date(Date.now() - 86400000).toISOString(),
    });
    expect(isDueForReview(card)).toBe(true);
  });

  it('returns true for now', () => {
    const card = makeCard({ next_review: new Date().toISOString() });
    expect(isDueForReview(card)).toBe(true);
  });

  it('returns false for future dates', () => {
    const card = makeCard({
      next_review: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(isDueForReview(card)).toBe(false);
  });
});

describe('getUrgencyScore', () => {
  it('gives higher score to more overdue cards', () => {
    const overdue = makeCard({
      next_review: new Date(Date.now() - 5 * 86400000).toISOString(),
    });
    const recent = makeCard({
      next_review: new Date(Date.now() - 1 * 86400000).toISOString(),
    });
    expect(getUrgencyScore(overdue)).toBeGreaterThan(getUrgencyScore(recent));
  });

  it('gives higher score to incorrect cards', () => {
    const incorrect = makeCard({ last_result: 'incorrect' });
    const correct = makeCard({ last_result: 'correct' });
    expect(getUrgencyScore(incorrect)).toBeGreaterThan(getUrgencyScore(correct));
  });
});

describe('getLearningStage', () => {
  it('classifies new cards', () => {
    expect(getLearningStage(makeCard({ repetitions: 0 }))).toBe('new');
  });

  it('classifies learning cards', () => {
    expect(getLearningStage(makeCard({ repetitions: 2, interval_days: 7 }))).toBe('learning');
  });

  it('classifies mastered cards (21+ day interval)', () => {
    expect(getLearningStage(makeCard({ repetitions: 5, interval_days: 30 }))).toBe('mastered');
  });
});

describe('sortCardsForQuiz', () => {
  it('puts due cards before non-due cards', () => {
    const due = makeCard({
      post_id: 'due',
      next_review: new Date(Date.now() - 86400000).toISOString(),
    });
    const notDue = makeCard({
      post_id: 'not-due',
      next_review: new Date(Date.now() + 86400000).toISOString(),
    });
    const sorted = sortCardsForQuiz([notDue, due]);
    expect(sorted[0].post_id).toBe('due');
  });
});
