'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getLearningStage } from '@/lib/srs';
import { createClient } from '@/lib/supabase/client';
import { calculateStreak, getWeekData } from '@/lib/utils';
import type { Post, QuizHistoryEntry, SRSCard } from '@/lib/types';

export function useStats(userId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState({
    postCount: 0,
    accuracy: 0,
    streak: 0,
    weekly: getWeekData([]),
    mastered: 0,
    learning: 0,
    fresh: 0,
    leaderboard: [] as { name: string; value: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [
      { data: posts, error: postsError },
      { data: cards, error: cardsError },
      { data: history, error: historyError },
      { error: profilesError },
    ] = await Promise.all([
      supabase.from('posts_with_counts').select('*'),
      supabase.from('srs_cards').select('*').eq('user_id', userId),
      supabase.from('quiz_history').select('*').eq('user_id', userId),
      supabase.from('profiles').select('id, username'),
    ]);

    if (postsError || cardsError || historyError || profilesError) {
      setError(
        postsError?.message ??
          cardsError?.message ??
          historyError?.message ??
          profilesError?.message ??
          'Failed to load stats'
      );
      setLoading(false);
      return;
    }

    const postList = (posts ?? []) as Post[];
    const cardList = (cards ?? []) as SRSCard[];
    const historyList = (history ?? []) as QuizHistoryEntry[];

    const totalCorrect = historyList.filter((entry) => entry.correct).length;
    const accuracy = historyList.length ? Math.round((totalCorrect / historyList.length) * 100) : 0;

    const activityDates = [
      ...postList.filter((post) => post.author_id === userId).map((post) => new Date(post.created_at)),
      ...historyList.map((entry) => new Date(entry.created_at)),
    ];

    const stageCounts = cardList.reduce(
      (acc, card) => {
        const stage = getLearningStage(card);
        if (stage === 'new') {
          acc.fresh += 1;
        } else if (stage === 'learning') {
          acc.learning += 1;
        } else {
          acc.mastered += 1;
        }
        return acc;
      },
      { mastered: 0, learning: 0, fresh: 0 }
    );

    const leaderboardSource = postList.reduce<Record<string, number>>((acc, post) => {
      acc[post.author_name || 'Unknown'] = (acc[post.author_name || 'Unknown'] ?? 0) + 1;
      return acc;
    }, {});

    setData({
      postCount: postList.filter((post) => post.author_id === userId).length,
      accuracy,
      streak: calculateStreak(activityDates),
      weekly: getWeekData(postList.filter((post) => post.author_id === userId).map((post) => post.created_at)),
      mastered: stageCounts.mastered,
      learning: stageCounts.learning,
      fresh: stageCounts.fresh,
      leaderboard: Object.entries(leaderboardSource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value })),
    });
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, loading, error, configured: Boolean(supabase), refresh: load };
}
