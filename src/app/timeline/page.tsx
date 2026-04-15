'use client';

import Link from 'next/link';

import { BottomNav } from '@/components/BottomNav';
import { PostForm } from '@/components/PostForm';
import { TopBar } from '@/components/TopBar';
import { WordCard } from '@/components/WordCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';

export default function TimelinePage() {
  const { user, loading: authLoading, configured } = useAuth();
  const { posts, reactionsByPost, commentsByPost, loading, error, createPost, toggleReaction, createComment } =
    usePosts(user?.id);

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
            Supabase 未設定のため保存はまだできません。`.env.local` に接続情報を入れると、認証とリアルタイム同期が有効になります。
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
          {posts.map((post) => (
            <WordCard
              key={post.id}
              post={post}
              reactions={reactionsByPost[post.id] ?? []}
              comments={commentsByPost[post.id] ?? []}
              userId={user?.id}
              onToggleReaction={toggleReaction}
              onCreateComment={createComment}
            />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm leading-6 text-text-mid">
            まだ投稿がありません。最初の単語をシェアすると、ここにカード形式で並びます。
          </p>
        </Card>
      )}

      <BottomNav />
    </div>
  );
}
