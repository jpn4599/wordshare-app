import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="flex min-h-[90vh] flex-col justify-center gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-primary">English Vocabulary Sharing App</p>
        <h1 className="mt-4 font-display text-5xl leading-tight text-text">
          Learn words
          <br />
          with your circle.
        </h1>
        <p className="mt-4 text-base leading-7 text-text-mid">
          友達と単語をシェアしながら、タイムライン・クイズ・統計で学習を続けるための WordShare。
        </p>
      </div>

      <Card className="space-y-4 bg-[#fffaf5]">
        <p className="text-sm leading-6 text-text-mid">
          Supabase を接続すると認証・リアルタイム同期・学習履歴保存がそのまま有効になります。
        </p>
        <div className="flex gap-3">
          <Link href="/timeline" className="flex-1">
            <Button block>アプリを見る</Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="secondary" block>
              ログイン
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
