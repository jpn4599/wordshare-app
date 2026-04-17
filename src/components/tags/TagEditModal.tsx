'use client';

import { useState, useEffect } from 'react';
import { TagBadge } from './TagBadge';
import type { Tag, TagAxis, TagSource } from '@/lib/types/tag';
import type { PostWithTags } from '@/lib/types';

interface TagEditModalProps {
  post: PostWithTags;
  onClose: () => void;
  onUpdate: (updated: PostWithTags) => void;
}

export function TagEditModal({ post, onClose, onUpdate }: TagEditModalProps) {
  const [tags, setTags] = useState(post.tags ?? []);
  const [newTagName, setNewTagName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tags?popular=true&limit=8')
      .then((r) => r.json())
      .then((data: { tags: Array<{ name: string }> }) => {
        const existing = new Set(tags.map((t) => t.name));
        setSuggestions(data.tags.filter((t) => !existing.has(t.name)).map((t) => t.name));
      })
      .catch(() => {});
  }, [tags]);

  const addTag = async (tagName: string) => {
    if (!tagName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: tagName.trim() }),
      });
      const data = (await res.json()) as {
        word_tag?: { tag: { id: string; name: string; axis: TagAxis; color: string | null; created_at?: string; updated_at?: string }; source: TagSource };
      };
      if (data.word_tag?.tag) {
        const t = data.word_tag.tag;
        const newTag: Tag & { source: TagSource } = {
          id: t.id,
          name: t.name,
          axis: t.axis,
          color: t.color,
          created_at: t.created_at ?? '',
          updated_at: t.updated_at ?? '',
          source: 'user' as TagSource,
        };
        setTags([...tags, newTag]);
        setNewTagName('');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (tagId: string) => {
    await fetch(`/api/posts/${post.id}/tags/${tagId}`, { method: 'DELETE' });
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const handleSave = () => {
    onUpdate({ ...post, tags });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 600 }}>
          「{post.word}」のタグ編集
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#8B8B8B' }}>
          {post.meaning}
        </p>

        {/* Current tags */}
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '12px', color: '#555555', margin: '0 0 8px', fontWeight: 500 }}>
            現在のタグ
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '28px' }}>
            {tags.map((tag) => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                source={tag.source}
                onRemove={() => void removeTag(tag.id)}
                size="md"
              />
            ))}
            {tags.length === 0 && (
              <span style={{ fontSize: '13px', color: '#8B8B8B' }}>タグがありません</span>
            )}
          </div>
        </div>

        {/* Add tag input */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void addTag(newTagName);
              }}
              placeholder="タグ名を入力 (例: ビジネス)"
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E8E0D8',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => void addTag(newTagName)}
              disabled={loading || !newTagName.trim()}
              style={{
                padding: '8px 16px',
                background: '#2D6A4F',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                opacity: loading || !newTagName.trim() ? 0.5 : 1,
              }}
            >
              追加
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div
            style={{
              background: '#F6F1EB',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 6px', fontWeight: 500 }}>
              よく使われるタグ
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void addTag(s)}
                  style={{
                    padding: '3px 10px',
                    fontSize: '12px',
                    background: '#fff',
                    border: '1px solid #E8E0D8',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#1B1B1B',
                  }}
                >
                  ＋ {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #E8E0D8',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#555555',
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: '#2D6A4F',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
