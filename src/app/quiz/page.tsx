'use client';

import { BottomNav } from '@/components/BottomNav';
import { QuizQuestion } from '@/components/QuizQuestion';
import { QuizResults } from '@/components/QuizResults';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useQuiz } from '@/hooks/useQuiz';

async function fetchHint(word: string, meaning: string) {
  const response = await fetch('/api/ai/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, meaning }),
  });
  const data = (await response.json()) as { text?: string };
  return data.text ?? null;
}

export default function QuizPage() {
  const { user } = useAuth();
  const { mode, setMode, currentQuestion, currentIndex, questions, results, finished, loading, configured, answer, refresh } =
    useQuiz(user?.id);

  return (
    <div className="space-y-6">
      <TopBar title="Quiz" subtitle="復習タイミングに合わせて、短く確実に思い出す。" />

      <Card className="space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === 'en2jp' ? 'primary' : 'secondary'} onClick={() => setMode('en2jp')}>
            英 → 日
          </Button>
          <Button variant={mode === 'jp2en' ? 'primary' : 'secondary'} onClick={() => setMode('jp2en')}>
            日 → 英
          </Button>
          <Button variant="ghost" onClick={() => void refresh()}>
            更新
          </Button>
        </div>
      </Card>

      {!configured ? (
        <Card>
          <p className="text-sm leading-6 text-text-mid">
            Supabase 接続後にクイズ履歴と SRS 更新が有効になります。
          </p>
        </Card>
      ) : loading ? (
        <Card>
          <p className="text-sm text-text-mid">クイズを準備中です...</p>
        </Card>
      ) : finished ? (
        <QuizResults results={results} onReset={() => void refresh()} />
      ) : currentQuestion ? (
        <QuizQuestion
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          onAnswer={(selected) => void answer(selected)}
          onHint={() => fetchHint(currentQuestion.post.word, currentQuestion.post.meaning)}
        />
      ) : (
        <Card>
          <p className="text-sm leading-6 text-text-mid">
            出題できる単語がまだありません。タイムラインから単語を投稿するとクイズに並びます。
          </p>
        </Card>
      )}

      <BottomNav />
    </div>
  );
}
