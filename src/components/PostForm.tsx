'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { UnsplashPicker, type UnsplashPickerPhoto } from '@/components/posts/UnsplashPicker';
import type { ImageCredit } from '@/lib/types';

export interface PostFormValues {
  word: string;
  meaning: string;
  example: string;
  episode: string;
  image_url?: string | null;
  image_source?: 'unsplash' | null;
  image_credit?: ImageCredit | null;
}

const initialValues: PostFormValues = {
  word: '',
  meaning: '',
  example: '',
  episode: '',
  image_url: null,
  image_source: null,
  image_credit: null,
};

export function PostForm({
  onSubmit,
}: {
  onSubmit: (values: PostFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<PostFormValues>(initialValues);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPickerPhoto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canSubmit = useMemo(() => values.word.trim() && values.meaning.trim(), [values]);

  function handleSelectPhoto(photo: UnsplashPickerPhoto | null) {
    setSelectedPhoto(photo);
    setValues((prev) => ({
      ...prev,
      image_url: photo?.url ?? null,
      image_source: photo ? 'unsplash' : null,
      image_credit: photo?.credit ?? null,
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Unsplash ダウンロード通知（選択時のみ）
      if (selectedPhoto) {
        await fetch('/api/unsplash/trigger-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ download_location: selectedPhoto.download_location }),
        }).catch(() => void 0);
      }

      await onSubmit(values);
      setValues(initialValues);
      setSelectedPhoto(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-4 bg-[#fffaf5]">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">New Word</p>
        <h2 className="mt-2 font-display text-2xl text-text">今日の単語をシェア</h2>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="英単語"
          value={values.word}
          onChange={(event) => setValues((prev) => ({ ...prev, word: event.target.value }))}
        />
        <Input
          placeholder="意味"
          value={values.meaning}
          onChange={(event) => setValues((prev) => ({ ...prev, meaning: event.target.value }))}
        />
        <Textarea
          placeholder="例文"
          value={values.example}
          onChange={(event) => setValues((prev) => ({ ...prev, example: event.target.value }))}
        />
        <Textarea
          placeholder="覚えた場面やメモ"
          value={values.episode}
          onChange={(event) => setValues((prev) => ({ ...prev, episode: event.target.value }))}
        />
      </div>

      {/* Unsplash 画像選択 */}
      {values.word.trim().length >= 2 && (
        <UnsplashPicker
          searchQuery={values.word.trim()}
          onSelect={handleSelectPhoto}
          selectedId={selectedPhoto?.id ?? null}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!values.word.trim() || !values.meaning.trim() || generating}
          onClick={async () => {
            setGenerating(true);
            try {
              const response = await fetch('/api/ai/example', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  word: values.word,
                  meaning: values.meaning,
                }),
              });
              const data = (await response.json()) as { text?: string; error?: string };
              if (data.text) {
                const text = data.text;
                setValues((prev) => ({ ...prev, example: text }));
              }
            } finally {
              setGenerating(false);
            }
          }}
        >
          {generating ? <Spinner /> : 'AIで例文生成'}
        </Button>

        <Button type="button" disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? <Spinner /> : '投稿する'}
        </Button>
      </div>
    </Card>
  );
}
