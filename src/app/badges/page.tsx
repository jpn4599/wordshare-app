'use client';

// v2.2 Phase 8: Badges collection page

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BadgeProgress {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  color_scheme: string;
  earned: boolean;
  earned_at: string | null;
  progress: number;
  target: number;
}

const COLOR_SCHEMES: Record<
  string,
  { bg: string; border: string; fill: string }
> = {
  teal: { bg: '#E1F5EE', border: '#0F6E56', fill: '#1D9E75' },
  pink: { bg: '#FBEAF0', border: '#D4537E', fill: '#D4537E' },
  amber: { bg: '#FAEEDA', border: '#BA7517', fill: '#BA7517' },
  blue: { bg: '#E6F1FB', border: '#185FA5', fill: '#185FA5' },
  purple: { bg: '#EEEDFE', border: '#534AB7', fill: '#534AB7' },
  gray: { bg: '#F6F1EB', border: '#888780', fill: '#888780' },
  green: { bg: '#EAF3DE', border: '#3B6D11', fill: '#3B6D11' },
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me/badges');
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? 'バッジの取得に失敗しました');
        } else {
          setBadges(data.badges ?? []);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <TopBar
        title="Badges"
        subtitle="学習マイルストーンを記念してバッジを獲得しよう。"
        action={
          <Link href="/timeline">
            <Button variant="secondary">Timeline</Button>
          </Link>
        }
      />

      {loading ? (
        <Card>
          <p className="text-sm text-text-mid">バッジを読み込み中...</p>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-sm text-accent">{error}</p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-text-light">
            {earnedCount} / {badges.length} 獲得
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            {badges.map((badge) => {
              const scheme = COLOR_SCHEMES[badge.color_scheme] ?? COLOR_SCHEMES.gray;
              const pct =
                badge.target > 0
                  ? Math.min(100, Math.round((badge.progress / badge.target) * 100))
                  : 0;

              return (
                <div
                  key={badge.badge_id}
                  style={{
                    background: '#FFFFFF',
                    border: badge.earned
                      ? `1.5px solid ${scheme.border}`
                      : '0.5px solid #E8E0D8',
                    borderRadius: '12px',
                    padding: '14px 12px',
                    textAlign: 'center',
                    position: 'relative',
                    opacity: badge.earned ? 1 : 0.65,
                  }}
                >
                  {badge.earned && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#0F6E56',
                        color: 'white',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✓
                    </div>
                  )}
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: badge.earned ? scheme.bg : '#F6F1EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      margin: '0 auto 10px',
                    }}
                  >
                    {badge.earned ? badge.icon : '🔒'}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, color: '#1B1B1B' }}>
                    {badge.name}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#8B8B8B',
                      margin: '2px 0 0',
                      lineHeight: 1.3,
                    }}
                  >
                    {badge.description}
                  </p>
                  {!badge.earned && (
                    <>
                      <div
                        style={{
                          marginTop: '8px',
                          height: '4px',
                          borderRadius: '2px',
                          background: '#F6F1EB',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: scheme.fill,
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '10px', color: '#8B8B8B', margin: '4px 0 0' }}>
                        {badge.progress} / {badge.target}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
