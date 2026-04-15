import { Card } from '@/components/ui/Card';

export function Leaderboard({
  items,
}: {
  items: { name: string; value: number }[];
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Leaderboard</p>
        <h2 className="mt-2 font-display text-2xl text-text">メンバーランキング</h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl bg-[#fff8f3] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {index + 1}
              </div>
              <p className="font-semibold text-text">{item.name}</p>
            </div>
            <p className="text-sm text-text-mid">{item.value} words</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
