import type { TagSource } from '@/lib/types/tag';

interface TagBadgeProps {
  name: string;
  source: TagSource;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const SOURCE_STYLES: Record<TagSource, { bg: string; color: string; icon: string }> = {
  ai: { bg: '#E6F1FB', color: '#0C447C', icon: '🤖' },
  ai_edited_by_user: { bg: '#E1F5EE', color: '#085041', icon: '✏️' },
  user: { bg: '#FAEEDA', color: '#633806', icon: '👤' },
};

export function TagBadge({ name, source, onRemove, size = 'sm' }: TagBadgeProps) {
  const style = SOURCE_STYLES[source];
  const fontSize = size === 'sm' ? '11px' : '13px';
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding,
        borderRadius: '10px',
        fontSize,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        lineHeight: '1.4',
      }}
    >
      <span style={{ fontSize: '10px' }}>{style.icon}</span>
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: style.color,
            cursor: 'pointer',
            opacity: 0.6,
            fontSize: '13px',
            padding: 0,
            marginLeft: '2px',
            lineHeight: 1,
          }}
          aria-label="タグを削除"
        >
          ×
        </button>
      )}
    </span>
  );
}
