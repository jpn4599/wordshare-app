'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

import { BadgeToast } from '@/components/badges/BadgeToast';
import { BottomNav } from '@/components/BottomNav';
import { FeaturedWordCard } from '@/components/featured/FeaturedWordCard';
import { PostForm, type PostFormValues } from '@/components/PostForm';
import { StreakCard } from '@/components/streak/StreakCard';
import { TagEditModal } from '@/components/tags/TagEditModal';
import { TagGroupedView } from '@/components/timeline/TagGroupedView';
import { ViewSwitcher, type TimelineView } from '@/components/timeline/ViewSwitcher';
import { TopBar } from '@/components/TopBar';
import { WordCard } from '@/components/WordCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useBadgeChecker } from '@/hooks/useBadgeChecker';
import { usePosts } from '@/hooks/usePosts';
import type { PostWithTags, ReactionCounts, ReactionType } from '@/lib/types';

export default function TimelinePage() {
  const { user, loading: authLoading, configured } = useAuth();
  const {
    posts,
    reactionsByPost,
    commentsByPost,
    loading,
    error,
    createPost,
    createComment,
    updatePostTags,
    updatePostReactions,
    deletePost,
  } = usePosts(user?.id);

  const { toast, checkBadges, dismissFirst } = useBadgeChecker();

  const [view, setView] = useState<TimelineView>('chronological');
  const [editingPost, setEditingPost] = useState<PostWithTags | null>(null);

  // Wrap createPost so we can fire a badge check after each new post.
  const handleCreatePost = useCallback(
    async (values: PostFormValues) => {
      await createPost(values);
      void checkBadges();
    },
    [createPost, checkBadges]
  );

  // Wrap reaction change so the badge checker fires whenever the
  // authenticated user adds (not removes) one of their own reactions.
  const handleReactionChange = useCallback(
    (
      postId: string,
      next: { counts: ReactionCounts; myReactions: ReactionType[] }
    ) => {
      const prev = reactionsByPost[postId]?.myReactions.length ?? 0;
      updatePostReactions(postId, next);
      if (next.myReactions.length > prev) void checkBadges();
    },
    [reactionsByPost, updatePostReactions, checkBadges]
  );

  return (
    <div className="space-y-6">
      <TopBar
        title="Timeline"
        subtitle="今日覚えた単語を、友達のフィードにのせよう。"
        action={
          <Link href="/login">
            <Button variant="secondary">Account</Button>
          </Link>
        }
      />

      {!configured ? (
        <Card>
          <p className="text-sm leading-6 text-text-mid">
            Supabase 未設定のため保存はまだできません。
          </p>
        </Card>
      ) : null}

      {configured && user ? <FeaturedWordCard /> : null}

      {configured && user ? <StreakCard /> : null}

      {configured && user ? (
        <PostForm onSubmit={handleCreatePost} />
      ) : (
        <Card className="space-y-4">
          <p className="text-sm leading-6 text-text-mid">
            投稿するにはログインが必要です。Magic Link か Google でサインインしてください。
          </p>
          <Link href="/login">
            <Button>ログインへ</Button>
          </Link>
        </Card>
      )}

      {loading || authLoading ? (
        <Card>
          <p className="text-sm text-text-mid">タイムラインを読み込み中です...</p>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-sm text-accent">{error}</p>
        </Card>
      ) : posts.length ? (
        <div className="space-y-4">
          {/* View switcher */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-light">{posts.length}単語</p>
            <ViewSwitcher current={view} onChange={setView} />
          </div>

          {view === 'chronological' ? (
            posts.map((post) => (
              <WordCard
                key={post.id}
                post={post}
                reactionState={
                  reactionsByPost[post.id] ?? {
                    counts: { got_it: 0, tough_one: 0, useful: 0 },
                    myReactions: [],
                  }
                }
                comments={commentsByPost[post.id] ?? []}
                userId={user?.id}
                onReactionChange={handleReactionChange}
                onCreateComment={createComment}
                onEditTags={user ? setEditingPost : undefined}
                onDelete={user ? deletePost : undefined}
              />
            ))
          ) : (
            <TagGroupedView
              posts={posts}
              onEditTags={user ? setEditingPost : () => {}}
              userId={user?.id}
              onDelete={user ? deletePost : undefined}
            />
          )}
        </div>
      ) : (
        <Card>
          <p className="text-sm leading-6 text-text-mid">
            まだ投稿がありません。最初の単語をシェアすると、ここにカード形式で並びます。
          </p>
        </Card>
      )}

      <BottomNav />

      {/* Tag edit modal */}
      {editingPost && (
        <TagEditModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={(updated) => {
            updatePostTags(updated);
            setEditingPost(null);
          }}
        />
      )}

      {/* v2.2: Badge earned toast */}
      {toast && (
        <BadgeToast badgeName={toast.name} icon={toast.icon} onClose={dismissFirst} />
      )}
    </div>
  );
}
