'use client';

// v2.2 Phase 7: StreakCard — shows current streak and last 7 days of activity.
// Colors: pink = posted; green = only reacted; gray = no activity.

import { useEffect, useState } from 'react';

interface DayActivity {
  date: string;
  posted: number;
  reacted: number;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_7_days: DayActivity[];
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function StreakCard() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/me/streak')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          if (d && typeof d.current_streak === 'number') setData(d);
          else setData({ current_streak: 0, longest_streak: 0, last_7_days: [] });
        }
      })
      .catch(() => {
        if (!cancelled) setData({ current_streak: 0, longest_streak: 0, last_7_days: [] });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) return null;

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '0.5px solid #E8E0D8',
        borderRadius: '14px',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EF9F27 0%, #D85A30 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          flexShrink: 0,
        }}
      >
        🔥
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '32px', fontWeight: 500, lineHeight: 1, color: '#1B1B1B' }}>
          {data.current_streak}
        </div>
        <div style={{ fontSize: '13px', color: '#555555', marginTop: '2px' }}>
          day streak · 連続アクティブ
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          {data.last_7_days.map((day) => {
            const weekday = WEEKDAY_LABELS[new Date(day.date).getDay()];
            const isToday = day.date === today;
            const posted = day.posted > 0;
            const reacted = day.reacted > 0;

            let bg = '#F6F1EB';
            let color = '#8B8B8B';
            if (posted) {
              bg = '#FBEAF0';
              color = '#993556';
            } else if (reacted) {
              bg = '#E1F5EE';
              color = '#0F6E56';
            }

            return (
              <div
                key={day.date}
                title={`${day.date}: 投稿 ${day.posted} / リアクション ${day.reacted}`}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 500,
                  background: bg,
                  color,
                  boxShadow: isToday ? '0 0 0 2px #EF9F27' : 'none',
                }}
              >
                {isToday ? '今' : weekday}
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
            fontSize: '11px',
            color: '#8B8B8B',
          }}
        >
          <span>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: '#FBEAF0',
                borderRadius: '50%',
                marginRight: '4px',
              }}
            />
            投稿
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: '#E1F5EE',
                borderRadius: '50%',
                marginRight: '4px',
              }}
            />
            リアクション
          </span>
          {data.longest_streak > 0 && (
            <span style={{ marginLeft: 'auto' }}>最長 {data.longest_streak}日</span>
          )}
        </div>
      </div>
    </div>
  );
}
