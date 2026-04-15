import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { SessionResult } from '@/lib/types';

export function QuizResults({
  results,
  onReset,
}: {
  results: SessionResult[];
  onReset: () => void;
}) {
  const correctCount = results.filter((result) => result.correct).length;
  const accuracy = results.length ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Result</p>
        <h2 className="mt-2 font-display text-3xl text-text">{accuracy}% correct</h2>
        <p className="mt-2 text-sm text-text-mid">
          {correctCount} / {results.length} 問に正解しました。
        </p>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={`${result.word}-${result.meaning}`}
            className="rounded-2xl border border-border bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-text">{result.word}</p>
                <p className="text-sm text-text-mid">{result.meaning}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${result.correct ? 'text-primary' : 'text-accent'}`}>
                  {result.correct ? 'Correct' : 'Retry'}
                </p>
                <p className="text-xs text-text-light">次回: {result.nextReviewDays}日後</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onReset}>もう一度はじめる</Button>
    </Card>
  );
}
