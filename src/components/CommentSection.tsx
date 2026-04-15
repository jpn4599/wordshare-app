'use client';

import { useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { timeAgo } from '@/lib/utils';
import type { Comment } from '@/lib/types';

export function CommentSection({
  comments,
  onSubmit,
  disabled,
}: {
  comments: Comment[];
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar name={comment.author_name || 'U'} color={comment.author_color} />
            <div className="flex-1 rounded-2xl bg-primary-faded px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text">{comment.author_name}</p>
                <span className="text-xs text-text-light">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-text-mid">{comment.text}</p>
            </div>
          </div>
        ))}
        {!comments.length && (
          <p className="text-sm text-text-light">まだコメントはありません。最初の一言をどうぞ。</p>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!text.trim() || disabled) {
            return;
          }
          setSubmitting(true);
          try {
            await onSubmit(text.trim());
            setText('');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Input
          placeholder="コメントを書く"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={disabled || submitting}
        />
        <Button type="submit" disabled={disabled || submitting || !text.trim()}>
          送信
        </Button>
      </form>
    </div>
  );
}
