'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { QuizQuestion as QuizQuestionType } from '@/lib/types';

export function QuizQuestion({
  question,
  index,
  total,
  onAnswer,
  onHint,
}: {
  question: QuizQuestionType;
  index: number;
  total: number;
  onAnswer: (selected: string) => void;
  onHint?: () => Promise<string | null>;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Question {index + 1}</p>
          <h2 className="mt-2 font-display text-2xl text-text">{question.question}</h2>
        </div>
        <span className="rounded-full bg-primary-faded px-3 py-1 text-xs font-semibold text-primary">
          {index + 1}/{total}
        </span>
      </div>

      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            className="rounded-2xl border border-border bg-white px-4 py-4 text-left text-sm font-medium text-text transition hover:border-primary hover:bg-primary-faded"
            onClick={() => onAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {onHint ? (
        <div className="space-y-3 rounded-2xl bg-[#fff8f3] p-4">
          <Button
            type="button"
            variant="ghost"
            className="px-0 py-0 text-accent"
            disabled={loadingHint}
            onClick={async () => {
              setLoadingHint(true);
              try {
                setHint(await onHint());
              } finally {
                setLoadingHint(false);
              }
            }}
          >
            {loadingHint ? 'ヒント生成中...' : 'AIヒントを見る'}
          </Button>
          {hint ? <p className="text-sm leading-6 text-text-mid">{hint}</p> : null}
        </div>
      ) : null}
    </Card>
  );
}
