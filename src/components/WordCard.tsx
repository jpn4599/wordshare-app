'use client';

import { useState } from 'react';
import { CommentSection } from '@/components/CommentSection';
import { ReactionBar } from '@/components/ReactionBar';
import { TagBadge } from '@/components/tags/TagBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { timeAgo } from '@/lib/utils';
import type { Comment, PostWithTags, Reaction } from '@/lib/types';

export function WordCard({
  post,
  reactions,
  comments,
  userId,
  onToggleReaction,
  onCreateComment,
  onEditTags,
  onDelete,
}: {
  post: PostWithTags;
  reactions: Reaction[];
  comments: Comment[];
  userId?: string;
  onToggleReaction: (postId: string, emoji: Reaction['emoji']) => void;
  onCreateComment: (postId: string, text: string) => Promise<void>;
  onEditTags?: (post: PostWithTags) => void;
  onDelete?: (postId: string) => Promise<void>;
}) {
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tags = post.tags ?? [];
  const isAuthor = Boolean(userId && userId === post.author_id);

  async function handleDelete() {
    if (!onDelete || deleting) return;
    const ok = window.confirm(
      `「${post.word}」を削除しますか？\n\nリアクション・コメント・タグもすべて一緒に削除されます。この操作は取り消せません。`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await onDelete(post.id);
    } catch (e) {
      alert(`削除に失敗しました: ${(e as Error).message}`);
      setDeleting(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar name={post.author_name || 'U'} color={post.author_color} />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">{post.author_name}</p>
              <p className="text-xs text-text-light">{timeAgo(post.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-sm text-primary"
                onClick={() => setShowComments((v) => !v)}
              >
                {showComments ? '閉じる' : `コメント ${comments.length}`}
              </button>
              {isAuthor && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  title="この投稿を削除"
                  aria-label="投稿を削除"
                  className="text-sm text-text-light transition hover:text-accent disabled:opacity-40"
                >
                  {deleting ? '削除中…' : '🗑'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-text">{post.word}</h2>
                <p className="mt-1 text-base font-medium text-accent">{post.meaning}</p>
              </div>
            </div>

            {post.example ? (
              <div className="rounded-2xl bg-[#fff8f3] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-text-light">Example</p>
                <p className="mt-2 text-sm leading-6 text-text-mid">{post.example}</p>
              </div>
            ) : null}

            {post.episode ? (
              <div className="rounded-2xl bg-primary-faded p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-text-light">Episode</p>
                <p className="mt-2 text-sm leading-6 text-text-mid">{post.episode}</p>
              </div>
            ) : null}

            {/* Tag area */}
            <div
              className="flex flex-wrap items-center gap-1.5"
              style={{ cursor: onEditTags ? 'pointer' : 'default' }}
              onClick={() => onEditTags?.(post)}
              title={onEditTags ? 'タグを編集' : undefined}
            >
              {tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} source={tag.source} />
              ))}
              {tags.length === 0 && post.tagging_status === 'pending' && (
                <span className="text-[11px] text-text-light">タグ生成待ち...</span>
              )}
              {tags.length === 0 && post.tagging_status === 'failed' && (
                <span className="text-[11px] text-text-light">タグ生成失敗</span>
              )}
              {onEditTags && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#8B8B8B',
                    padding: '2px 6px',
                    border: '1px dashed #E8E0D8',
                    borderRadius: '8px',
                  }}
                >
                  ＋ タグ編集
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReactionBar
        reactions={reactions}
        userId={userId}
        onToggle={(emoji) => onToggleReaction(post.id, emoji)}
      />

      {showComments ? (
        <CommentSection comments={comments} onSubmit={(text) => onCreateComment(post.id, text)} />
      ) : null}
    </Card>
  );
}
