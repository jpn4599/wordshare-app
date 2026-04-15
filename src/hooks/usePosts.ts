'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { Comment, Post, Reaction } from '@/lib/types';

type PostBundle = {
  posts: Post[];
  reactionsByPost: Record<string, Reaction[]>;
  commentsByPost: Record<string, Comment[]>;
};

function groupBy<T extends { post_id: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.post_id] ??= [];
    acc[item.post_id].push(item);
    return acc;
  }, {});
}

export function usePosts(userId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [bundle, setBundle] = useState<PostBundle>({
    posts: [],
    reactionsByPost: {},
    commentsByPost: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [{ data: posts, error: postsError }, { data: reactions }, { data: comments }] =
      await Promise.all([
        supabase.from('posts_with_counts').select('*').order('created_at', { ascending: false }),
        supabase.from('reactions').select('*'),
        supabase
          .from('comments')
          .select('*, profiles:author_id(username, avatar_color)')
          .order('created_at', { ascending: true }),
      ]);

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    const normalizedComments =
      comments?.map((comment) => ({
        ...comment,
        author_name:
          Array.isArray(comment.profiles) ? comment.profiles[0]?.username : comment.profiles?.username,
        author_color:
          Array.isArray(comment.profiles)
            ? comment.profiles[0]?.avatar_color
            : comment.profiles?.avatar_color,
      })) ?? [];

    setBundle({
      posts: (posts ?? []) as Post[],
      reactionsByPost: groupBy((reactions ?? []) as Reaction[]),
      commentsByPost: groupBy(normalizedComments as Comment[]),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('wordshare-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => void load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        () => void load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const createPost = useCallback(
    async (values: Pick<Post, 'word' | 'meaning' | 'example' | 'episode'>) => {
      if (!supabase || !userId) {
        return;
      }

      const { error: insertError } = await supabase.from('posts').insert({
        author_id: userId,
        ...values,
      });

      if (insertError) {
        throw insertError;
      }

      await load();
    },
    [load, supabase, userId]
  );

  const toggleReaction = useCallback(
    async (postId: string, emoji: Reaction['emoji']) => {
      if (!supabase || !userId) {
        return;
      }

      const existing = bundle.reactionsByPost[postId]?.find(
        (reaction) => reaction.user_id === userId && reaction.emoji === emoji
      );

      if (existing) {
        const { error: deleteError } = await supabase.from('reactions').delete().eq('id', existing.id);
        if (deleteError) {
          throw deleteError;
        }
      } else {
        const { error: insertError } = await supabase.from('reactions').insert({
          post_id: postId,
          user_id: userId,
          emoji,
        });
        if (insertError) {
          throw insertError;
        }
      }

      await load();
    },
    [bundle.reactionsByPost, load, supabase, userId]
  );

  const createComment = useCallback(
    async (postId: string, text: string) => {
      if (!supabase || !userId) {
        return;
      }

      const { error: insertError } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: userId,
        text,
      });
      if (insertError) {
        throw insertError;
      }
      await load();
    },
    [load, supabase, userId]
  );

  return {
    ...bundle,
    loading,
    error,
    configured: Boolean(supabase),
    refresh: load,
    createPost,
    toggleReaction,
    createComment,
  };
}
