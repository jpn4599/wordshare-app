'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createSRSCard, getUrgencyScore, isDueForReview, updateSRSCard } from '@/lib/srs';
import { createClient } from '@/lib/supabase/client';
import { shuffle } from '@/lib/utils';
import type { Post, QuizQuestion, SessionResult, SRSCard } from '@/lib/types';

type QuizMode = 'en2jp' | 'jp2en';

function buildQuestion(mode: QuizMode, post: Post, posts: Post[], card: SRSCard): QuizQuestion {
  const distractorPool = shuffle(
    posts
      .filter((candidate) => candidate.id !== post.id)
      .map((candidate) => (mode === 'en2jp' ? candidate.meaning : candidate.word))
  ).slice(0, 3);

  const answer = mode === 'en2jp' ? post.meaning : post.word;

  return {
    post,
    question: mode === 'en2jp' ? post.word : post.meaning,
    answer,
    options: shuffle([answer, ...distractorPool]),
    srsCard: card,
    isDue: isDueForReview(card),
  };
}

export function useQuiz(userId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<QuizMode>('en2jp');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [{ data: posts, error: postsError }, { data: cards, error: cardsError }] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('srs_cards').select('*').eq('user_id', userId),
    ]);

    if (postsError || cardsError) {
      setError(postsError?.message ?? cardsError?.message ?? 'Failed to load quiz');
      setLoading(false);
      return;
    }

    const postList = (posts ?? []) as Post[];
    let cardList = (cards ?? []) as SRSCard[];

    const missingCards = postList
      .filter((post) => !cardList.some((card) => card.post_id === post.id))
      .map((post) => createSRSCard(userId, post.id));

    if (missingCards.length) {
      const { data: inserted, error: upsertError } = await supabase
        .from('srs_cards')
        .upsert(missingCards, { onConflict: 'user_id,post_id' })
        .select();
      if (upsertError) {
        setError(upsertError.message);
        setLoading(false);
        return;
      }
      cardList = [...cardList, ...((inserted ?? []) as SRSCard[])];
    }

    const cardsByPost = new Map(cardList.map((card) => [card.post_id, card]));
    const orderedPosts = [...postList].sort((a, b) => {
      const aScore = getUrgencyScore(cardsByPost.get(a.id)!);
      const bScore = getUrgencyScore(cardsByPost.get(b.id)!);
      return bScore - aScore;
    });

    setQuestions(
      orderedPosts.map((post) => buildQuestion(mode, post, postList, cardsByPost.get(post.id)!))
    );
    setIndex(0);
    setResults([]);
    setLoading(false);
  }, [mode, supabase, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const answer = useCallback(
    async (selected: string) => {
      if (!supabase || !userId) {
        return;
      }

      const question = questions[index];
      if (!question) {
        return;
      }

      const correct = selected === question.answer;
      const next = updateSRSCard(question.srsCard, correct ? 4 : 1);

      await Promise.all([
        supabase
          .from('srs_cards')
          .update(next)
          .eq('id', question.srsCard.id),
        supabase.from('quiz_history').insert({
          user_id: userId,
          post_id: question.post.id,
          mode,
          correct,
        }),
      ]);

      setResults((prev) => [
        ...prev,
        {
          word: question.post.word,
          meaning: question.post.meaning,
          correct,
          nextReviewDays: next.interval_days,
        },
      ]);
      setIndex((prev) => prev + 1);
    },
    [index, mode, questions, supabase, userId]
  );

  return {
    mode,
    setMode,
    questions,
    currentQuestion: questions[index],
    currentIndex: index,
    results,
    finished: index >= questions.length && questions.length > 0,
    loading,
    error,
    configured: Boolean(supabase),
    refresh: load,
    answer,
  };
}
