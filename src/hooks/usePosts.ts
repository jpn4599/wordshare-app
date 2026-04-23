'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Comment, Post, PostWithTags, Reaction } from '@/lib/types';
import type { Tag, TagSource } from '@/lib/types/tag';

type PostBundle = {
  posts: PostWithTags[];
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

    const [
      { data: posts, error: postsError },
      { data: reactions },
      { data: comments },
      { data: wordTags },
    ] = await Promise.all([
      supabase.from('posts_with_counts').select('*').order('created_at', { ascending: false }),
      supabase.from('reactions').select('*'),
      supabase
        .from('comments')
        .select('*, profiles:author_id(username, avatar_color)')
        .order('created_at', { ascending: true }),
      supabase
        .from('word_tags')
        .select('post_id, source, tag:tags(id, name, axis, color)'),
    ]);

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    // Group tags by post_id
    const tagsByPost: Record<string, Array<Tag & { source: TagSource }>> = {};
    for (const wt of wordTags ?? []) {
      const tag = Array.isArray(wt.tag) ? wt.tag[0] : wt.tag;
      if (!tag) continue;
      tagsByPost[wt.post_id] ??= [];
      tagsByPost[wt.post_id].push({ ...(tag as Tag), source: wt.source as TagSource });
    }

    const normalizedComments =
      comments?.map((comment) => ({
        ...comment,
        author_name: Array.isArray(comment.profiles)
          ? comment.profiles[0]?.username
          : comment.profiles?.username,
        author_color: Array.isArray(comment.profiles)
          ? comment.profiles[0]?.avatar_color
          : comment.profiles?.avatar_color,
      })) ?? [];

    const postsWithTags: PostWithTags[] = ((posts ?? []) as Post[]).map((p) => ({
      ...p,
      tags: tagsByPost[p.id] ?? [],
    }));

    setBundle({
      posts: postsWithTags,
      reactionsByPost: groupBy((reactions ?? []) as Reaction[]),
      commentsByPost: groupBy(normalizedComments as Comment[]),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime subscriptions (posts, reactions, comments, word_tags)
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('wordshare-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_tags' }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const createPost = useCallback(
    async (values: Pick<Post, 'word' | 'meaning' | 'example' | 'episode'>) => {
      if (!supabase || !userId) return;

      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert({ author_id: userId, ...values })
        .select('id')
        .single();

      if (insertError) throw insertError;

      await load();

      // Phase 4: Trigger background tagging (fire-and-forget)
      if (newPost?.id && process.env.NEXT_PUBLIC_TAG_GENERATION_ENABLED !== 'false') {
        fetch('/api/posts/tags/batch-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_ids: [newPost.id] }),
        }).catch((err) => console.warn('Background tag generation failed:', err));
      }
    },
    [load, supabase, userId]
  );

  const toggleReaction = useCallback(
    async (postId: string, emoji: Reaction['emoji']) => {
      if (!supabase || !userId) return;

      const existing = bundle.reactionsByPost[postId]?.find(
        (r) => r.user_id === userId && r.emoji === emoji
      );

      if (existing) {
        const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({ post_id: postId, user_id: userId, emoji });
        if (error) throw error;
      }

      await load();
    },
    [bundle.reactionsByPost, load, supabase, userId]
  );

  const createComment = useCallback(
    async (postId: string, text: string) => {
      if (!supabase || !userId) return;

      const { error } = await supabase.from('comments').insert({ post_id: postId, author_id: userId, text });
      if (error) throw error;
      await load();
    },
    [load, supabase, userId]
  );

  /** Update a post's tag list locally (after TagEditModal saves) */
  const updatePostTags = useCallback((updatedPost: PostWithTags) => {
    setBundle((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    }));
  }, []);

  /** Delete a post (author only — enforced by Supabase RLS) */
  const deletePost = useCallback(
    async (postId: string) => {
      if (!supabase || !userId) return;

      // Optimistic UI update — remove immediately
      setBundle((prev) => ({
        posts: prev.posts.filter((p) => p.id !== postId),
        reactionsByPost: Object.fromEntries(
          Object.entries(prev.reactionsByPost).filter(([id]) => id !== postId)
        ),
        commentsByPost: Object.fromEntries(
          Object.entries(prev.commentsByPost).filter(([id]) => id !== postId)
        ),
      }));

      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);

      if (deleteError) {
        // Roll back on error by re-fetching full state
        await load();
        throw deleteError;
      }
      // Reactions, comments, word_tags, srs_cards, quiz_history all cascade via FK
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
    updatePostTags,
    deletePost,
  };
}
