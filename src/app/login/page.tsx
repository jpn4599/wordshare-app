'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { supabase, configured, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-6">
      <TopBar title="Login" subtitle="Magic Link ですぐに始められます。" />

      <Card className="space-y-4">
        {!configured ? (
          <p className="text-sm leading-6 text-text-mid">
            `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定すると認証が有効になります。
          </p>
        ) : user ? (
          <p className="text-sm leading-6 text-text-mid">ログイン済みです。タイムラインから続けられます。</p>
        ) : (
          <>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="flex flex-col gap-3">
              <Button
                disabled={loading || !email.trim()}
                onClick={async () => {
                  if (!supabase) {
                    return;
                  }
                  const redirectTo = `${window.location.origin}/api/auth/callback`;
                  const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { emailRedirectTo: redirectTo },
                  });
                  setMessage(error ? error.message : 'メールを送信しました。リンクからログインしてください。');
                }}
              >
                Magic Link を送る
              </Button>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={async () => {
                  if (!supabase) {
                    return;
                  }
                  const redirectTo = `${window.location.origin}/api/auth/callback`;
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo },
                  });
                }}
              >
                Google でログイン
              </Button>
            </div>
            {message ? <p className="text-sm text-text-mid">{message}</p> : null}
          </>
        )}
      </Card>
    </div>
  );
}
