'use client';

import { useState } from 'react';
import Link from 'next/link';

import { BottomNav } from '@/components/BottomNav';
import { PostForm } from '@/components/PostForm';
import { TagEditModal } from '@/components/tags/TagEditModal';
import { TagGroupedView } from '@/components/timeline/TagGroupedView';
import { ViewSwitcher, type TimelineView } from '@/components/timeline/ViewSwitcher';
import { TopBar } from '@/components/TopBar';
import { WordCard } from '@/components/WordCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import type { PostWithTags } from '@/lib/types';

export default function TimelinePage() {
  const { user, loading: authLoading, configured } = useAuth();
  const {
    posts,
    reactionsByPost,
    commentsByPost,
    loading,
    error,
    createPost,
    toggleReaction,
    createComment,
    updatePostTags,
  } = usePosts(user?.id);

  const [view, setView] = useState<TimelineView>('chronological');
  const [editingPost, setEditingPost] = useState<PostWithTags | null>(null);

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

      {configured && user ? (
        <PostForm onSubmit={createPost} />
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
                reactions={reactionsByPost[post.id] ?? []}
                comments={commentsByPost[post.id] ?? []}
                userId={user?.id}
                onToggleReaction={toggleReaction}
                onCreateComment={createComment}
                onEditTags={user ? setEditingPost : undefined}
              />
            ))
          ) : (
            <TagGroupedView
              posts={posts}
              onEditTags={user ? setEditingPost : () => {}}
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
    </div>
  );
}
