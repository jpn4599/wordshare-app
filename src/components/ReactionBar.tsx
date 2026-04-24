'use client';

// v2.2 Phase 6: Semantic reactions (Got it! / Tough one / Useful) + Reply
// Uses optimistic UI updates; API failures are rolled back.

import { useState } from 'react';
import type { ReactionCounts, ReactionType } from '@/lib/types';

interface ReactionBarProps {
  postId: string;
  counts: ReactionCounts;
  myReactions: ReactionType[];
  replyCount?: number;
  onReplyClick?: () => void;
  onChange?: (next: { counts: ReactionCounts; myReactions: ReactionType[] }) => void;
}

const REACTIONS: Array<{
  type: ReactionType;
  icon: string;
  label: string;
  activeBg: string;
  activeColor: string;
}> = [
  { type: 'got_it', icon: '⭐', label: 'Got it!', activeBg: '#FBEAF0', activeColor: '#993556' },
  { type: 'tough_one', icon: '🔥', label: 'Tough one', activeBg: '#FAEEDA', activeColor: '#854F0B' },
  { type: 'useful', icon: '💡', label: 'Useful', activeBg: '#E1F5EE', activeColor: '#0F6E56' },
];

export function ReactionBar({
  postId,
  counts,
  myReactions,
  replyCount = 0,
  onReplyClick,
  onChange,
}: ReactionBarProps) {
  const [pending, setPending] = useState<ReactionType | null>(null);
  const mySet = new Set(myReactions);

  async function toggle(type: ReactionType) {
    if (pending) return;
    setPending(type);

    const isActive = mySet.has(type);
    // Optimistic update
    const nextCounts: ReactionCounts = {
      ...counts,
      [type]: Math.max(0, counts[type] + (isActive ? -1 : 1)),
    };
    const nextMySet = new Set(mySet);
    if (isActive) nextMySet.delete(type);
    else nextMySet.add(type);
    onChange?.({ counts: nextCounts, myReactions: Array.from(nextMySet) });

    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        // Roll back
        onChange?.({ counts, myReactions });
      }
    } catch {
      onChange?.({ counts, myReactions });
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '0.5px solid #E8E0D8',
        flexWrap: 'wrap',
      }}
    >
      {REACTIONS.map((r) => {
        const active = mySet.has(r.type);
        const disabled = pending === r.type;
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => toggle(r.type)}
            disabled={disabled}
            aria-pressed={active}
            aria-label={r.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              padding: '4px 8px',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                border: `1.5px solid ${active ? r.activeColor : 'transparent'}`,
                background: active ? r.activeBg : '#F6F1EB',
                transition: 'transform 0.15s, background 0.15s',
              }}
            >
              {r.icon}
            </div>
            <span
              style={{
                fontSize: '12px',
                color: active ? r.activeColor : '#8B8B8B',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {counts[r.type]}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: active ? r.activeColor : '#8B8B8B',
              }}
            >
              {r.label}
            </span>
          </button>
        );
      })}

      {onReplyClick && (
        <button
          type="button"
          onClick={onReplyClick}
          aria-label="Reply"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#F6F1EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            💬
          </div>
          <span
            style={{
              fontSize: '12px',
              color: '#8B8B8B',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {replyCount}
          </span>
          <span style={{ fontSize: '11px', color: '#8B8B8B' }}>Reply</span>
        </button>
      )}
    </div>
  );
}
