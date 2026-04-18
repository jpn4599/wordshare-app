'use client';

import { BottomNav } from '@/components/BottomNav';
import { Leaderboard } from '@/components/Leaderboard';
import { SRSProgress } from '@/components/SRSProgress';
import { TopBar } from '@/components/TopBar';
import { WeeklyChart } from '@/components/WeeklyChart';
import { BulkTaggingPanel } from '@/components/tags/BulkTaggingPanel';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';

export default function StatsPage() {
  const { user } = useAuth();
  const { postCount, accuracy, streak, weekly, mastered, learning, fresh, leaderboard, loading, configured } =
    useStats(user?.id);

  return (
    <div className="space-y-6">
      <TopBar title="Stats" subtitle="続けられている実感を、数字でも見える化。" />

      {!configured ? (
        <Card>
          <p className="text-sm leading-6 text-text-mid">
            Supabase を接続すると投稿数、正答率、ストリークなどが記録されます。
          </p>
        </Card>
      ) : loading ? (
        <Card>
          <p className="text-sm text-text-mid">統計を計算中です...</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-light">Posts</p>
              <p className="mt-2 font-display text-3xl text-text">{postCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-light">Accuracy</p>
              <p className="mt-2 font-display text-3xl text-text">{accuracy}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-light">Streak</p>
              <p className="mt-2 font-display text-3xl text-text">{streak}</p>
            </Card>
          </div>

          <SRSProgress mastered={mastered} learning={learning} fresh={fresh} />
          <WeeklyChart data={weekly} />
          <Leaderboard items={leaderboard} />
          {user && <BulkTaggingPanel />}
        </>
      )}

      <BottomNav />
    </div>
  );
}
