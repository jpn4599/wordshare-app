import { Card } from '@/components/ui/Card';

export function SRSProgress({
  mastered,
  learning,
  fresh,
}: {
  mastered: number;
  learning: number;
  fresh: number;
}) {
  const total = Math.max(mastered + learning + fresh, 1);

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">SRS Progress</p>
        <h2 className="mt-2 font-display text-2xl text-text">学習の進み具合</h2>
      </div>

      <div className="flex h-4 overflow-hidden rounded-full bg-[#eadfd5]">
        <div className="bg-primary" style={{ width: `${(mastered / total) * 100}%` }} />
        <div className="bg-accent-light" style={{ width: `${(learning / total) * 100}%` }} />
        <div className="bg-primary-faded" style={{ width: `${(fresh / total) * 100}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="font-semibold text-text">習得済み</p>
          <p className="text-text-mid">{mastered}</p>
        </div>
        <div>
          <p className="font-semibold text-text">学習中</p>
          <p className="text-text-mid">{learning}</p>
        </div>
        <div>
          <p className="font-semibold text-text">未学習</p>
          <p className="text-text-mid">{fresh}</p>
        </div>
      </div>
    </Card>
  );
}
