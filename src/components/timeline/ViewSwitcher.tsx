'use client';

export type TimelineView = 'chronological' | 'by_tag';

interface ViewSwitcherProps {
  current: TimelineView;
  onChange: (view: TimelineView) => void;
}

export function ViewSwitcher({ current, onChange }: ViewSwitcherProps) {
  const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: '13px',
    background: active ? '#FFFFFF' : 'transparent',
    border: active ? '0.5px solid #E8E0D8' : 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: active ? '#1B1B1B' : '#8B8B8B',
    fontWeight: active ? 500 : 400,
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        background: '#F6F1EB',
        borderRadius: '8px',
        padding: '3px',
        gap: '2px',
      }}
    >
      <button
        type="button"
        style={buttonStyle(current === 'chronological')}
        onClick={() => onChange('chronological')}
      >
        🕐 時間順
      </button>
      <button
        type="button"
        style={buttonStyle(current === 'by_tag')}
        onClick={() => onChange('by_tag')}
      >
        🏷️ タグ別
      </button>
    </div>
  );
}
