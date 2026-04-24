import type { TagSource } from '@/lib/types/tag';

interface TagBadgeProps {
  name: string;
  source: TagSource;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  /** 画像上にオーバーレイ表示する場合 true。半透明白背景に切り替わる */
  overlayMode?: boolean;
}

const SOURCE_STYLES: Record<TagSource, { bg: string; color: string; icon: string }> = {
  ai: { bg: '#E6F1FB', color: '#0C447C', icon: '🤖' },
  ai_edited_by_user: { bg: '#E1F5EE', color: '#085041', icon: '✏️' },
  user: { bg: '#FAEEDA', color: '#633806', icon: '👤' },
};

export function TagBadge({ name, source, onRemove, size = 'sm', overlayMode = false }: TagBadgeProps) {
  const style = SOURCE_STYLES[source];
  const fontSize = size === 'sm' ? '11px' : '13px';
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const bg = overlayMode ? 'rgba(255, 255, 255, 0.88)' : style.bg;
  const color = style.color;

  return (
    <span
      style={{
        background: bg,
        color,
        padding,
        borderRadius: '10px',
        fontSize,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        lineHeight: '1.4',
        backdropFilter: overlayMode ? 'blur(4px)' : undefined,
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
