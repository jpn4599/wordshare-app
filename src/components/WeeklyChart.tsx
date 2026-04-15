import { Card } from '@/components/ui/Card';

export function WeeklyChart({
  data,
}: {
  data: { day: string; count: number; isToday: boolean }[];
}) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Weekly Activity</p>
        <h2 className="mt-2 font-display text-2xl text-text">今週の投稿</h2>
      </div>

      <div className="flex items-end justify-between gap-3">
        {data.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end rounded-full bg-primary-faded p-1">
              <div
                className={`w-full rounded-full ${item.isToday ? 'bg-accent' : 'bg-primary'}`}
                style={{ height: `${Math.max((item.count / max) * 100, item.count ? 18 : 8)}%` }}
              />
            </div>
            <p className="text-xs text-text-mid">{item.day}</p>
            <p className="text-xs font-semibold text-text">{item.count}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
