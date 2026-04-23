'use client';

import React, { useState, useMemo } from 'react';
import { TagBadge } from '@/components/tags/TagBadge';
import type { PostWithTags } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface TagGroupedViewProps {
  posts: PostWithTags[];
  onEditTags: (post: PostWithTags) => void;
  userId?: string;
  onDelete?: (postId: string) => Promise<void>;
}

type SortMode = 'count' | 'name' | 'recent';

export function TagGroupedView({ posts, onEditTags, userId, onDelete }: TagGroupedViewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, post: PostWithTags) {
    e.stopPropagation();
    if (!onDelete || deletingId) return;
    const ok = window.confirm(
      `「${post.word}」を削除しますか？\n\nリアクション・コメント・タグもすべて一緒に削除されます。この操作は取り消せません。`
    );
    if (!ok) return;

    setDeletingId(post.id);
    try {
      await onDelete(post.id);
    } catch (err) {
      alert(`削除に失敗しました: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  }
  const [sortMode, setSortMode] = useState<SortMode>('count');
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['__first__']));

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { name: string; posts: PostWithTags[]; latestAt: number }
    >();

    for (const post of posts) {
      const tags = post.tags ?? [];
      for (const tag of tags) {
        if (!map.has(tag.name)) {
          map.set(tag.name, { name: tag.name, posts: [], latestAt: 0 });
        }
        const group = map.get(tag.name)!;
        if (!group.posts.find((p) => p.id === post.id)) {
          group.posts.push(post);
          group.latestAt = Math.max(group.latestAt, new Date(post.created_at).getTime());
        }
      }
    }

    // Untagged posts
    const untagged = posts.filter((p) => !p.tags || p.tags.length === 0);
    if (untagged.length > 0) {
      map.set('__untagged__', {
        name: 'タグなし',
        posts: untagged,
        latestAt: Math.max(...untagged.map((p) => new Date(p.created_at).getTime())),
      });
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (a.name === 'タグなし') return 1;
      if (b.name === 'タグなし') return -1;
      if (sortMode === 'count') return b.posts.length - a.posts.length;
      if (sortMode === 'name') return a.name.localeCompare(b.name, 'ja');
      return b.latestAt - a.latestAt;
    });

    return sorted;
  }, [posts, sortMode]);

  // Auto-expand first group
  const firstGroup = groups[0];
  const effectiveExpanded = useMemo(() => {
    if (firstGroup && expandedTags.has('__first__')) {
      const s = new Set(expandedTags);
      s.delete('__first__');
      s.add(firstGroup.name);
      return s;
    }
    return expandedTags;
  }, [expandedTags, firstGroup]);

  const toggle = (name: string) => {
    const next = new Set(effectiveExpanded);
    next.has(name) ? next.delete(name) : next.add(name);
    setExpandedTags(next);
  };

  if (posts.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#8B8B8B', fontSize: '14px' }}>
        まだ単語がありません
      </div>
    );
  }

  const sortBtn = (mode: SortMode, label: string) => (
    <button
      type="button"
      onClick={() => setSortMode(mode)}
      style={{
        padding: '4px 10px',
        fontSize: '12px',
        background: sortMode === mode ? '#E8E0D8' : 'transparent',
        border: '1px solid #E8E0D8',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#1B1B1B',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Sort controls */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '12px', color: '#8B8B8B' }}>並び順:</span>
        {sortBtn('count', '単語数順')}
        {sortBtn('name', '名前順')}
        {sortBtn('recent', '更新順')}
      </div>

      {/* Tag groups */}
      {groups.map((group) => {
        const isUntagged = group.name === 'タグなし';
        const expanded = effectiveExpanded.has(group.name);

        return (
          <div key={group.name} style={{ marginBottom: '12px' }}>
            {/* Group header */}
            <div
              onClick={() => toggle(group.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: isUntagged ? '#F6F1EB' : '#E6F1FB',
                borderRadius: expanded ? '8px 8px 0 0' : '8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8B8B8B' }}>{expanded ? '▼' : '▶'}</span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: isUntagged ? 'transparent' : '#E6F1FB',
                    border: isUntagged ? '0.5px dashed #E8E0D8' : '0.5px solid #378ADD',
                    color: isUntagged ? '#8B8B8B' : '#0C447C',
                  }}
                >
                  {group.name}
                </span>
                <span style={{ fontSize: '12px', color: '#8B8B8B' }}>{group.posts.length}単語</span>
              </div>
            </div>

            {/* Post cards */}
            {expanded && (
              <div
                style={{
                  border: '1px solid #E8E0D8',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  overflow: 'hidden',
                }}
              >
                {group.posts.map((post) => (
                  <div
                    key={`${group.name}-${post.id}`}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '0.5px solid #F6F1EB',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Avatar name={post.author_name || 'U'} color={post.author_color} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: '6px',
                            marginBottom: '2px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>{post.author_name}</span>
                            <span style={{ fontSize: '11px', color: '#8B8B8B' }}>
                              ・ {timeAgo(post.created_at)}
                            </span>
                          </div>
                          {userId && userId === post.author_id && onDelete && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, post)}
                              disabled={deletingId === post.id}
                              title="この投稿を削除"
                              aria-label="投稿を削除"
                              style={{
                                fontSize: '12px',
                                color: '#8B8B8B',
                                background: 'transparent',
                                border: 'none',
                                cursor: deletingId === post.id ? 'wait' : 'pointer',
                                padding: '2px 4px',
                                opacity: deletingId === post.id ? 0.4 : 1,
                                flexShrink: 0,
                              }}
                            >
                              {deletingId === post.id ? '…' : '🗑'}
                            </button>
                          )}
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: '#1B1B1B' }}>
                            {post.word}
                          </span>
                          <span style={{ color: '#E76F51', fontSize: '13px', marginLeft: '8px' }}>
                            {post.meaning}
                          </span>
                        </div>
                        {/* Tags */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTags(post);
                          }}
                          title="タグを編集"
                        >
                          {(post.tags ?? []).map((tag) => (
                            <TagBadge key={tag.id} name={tag.name} source={tag.source} />
                          ))}
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
