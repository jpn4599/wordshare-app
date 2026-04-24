'use client';

import { useEffect, useState } from 'react';

export interface UnsplashPickerPhoto {
  id: string;
  url: string;
  thumb: string;
  alt: string | null;
  download_location: string;
  credit: {
    photographer_name: string;
    photographer_url: string;
    unsplash_url: string;
  };
}

interface UnsplashPickerProps {
  searchQuery: string;
  onSelect: (photo: UnsplashPickerPhoto | null) => void;
  selectedId?: string | null;
}

export function UnsplashPicker({ searchQuery, onSelect, selectedId }: UnsplashPickerProps) {
  const [photos, setPhotos] = useState<UnsplashPickerPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setPhotos([]);
      setNoResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setNoResults(false);
      try {
        const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(searchQuery)}`);
        const data = (await res.json()) as {
          photos?: UnsplashPickerPhoto[];
          disabled?: boolean;
        };
        if (data.disabled) {
          setDisabled(true);
          setPhotos([]);
          return;
        }
        setPhotos(data.photos ?? []);
        setNoResults(!data.photos || data.photos.length === 0);
      } catch (e) {
        console.error(e);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (disabled) {
    return null;
  }

  if (loading) {
    return <p className="text-xs text-text-light">画像を検索中...</p>;
  }

  if (!searchQuery || searchQuery.trim().length < 2) {
    return null;
  }

  if (noResults) {
    return (
      <p className="text-xs text-text-light">
        関連画像が見つかりませんでした（画像なしで投稿できます）
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-text-mid">画像を選択（任意）</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {photos.map((photo) => (
          <button
            type="button"
            key={photo.id}
            onClick={() => onSelect(photo)}
            style={{
              aspectRatio: '4/3',
              background: `url(${photo.thumb}) center/cover`,
              border:
                selectedId === photo.id
                  ? '2px solid #2D6A4F'
                  : '1px solid #E8E0D8',
              borderRadius: '10px',
              cursor: 'pointer',
              padding: 0,
              position: 'relative',
            }}
            aria-label={photo.alt || 'Select this image'}
          />
        ))}
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            aspectRatio: '4/3',
            background: '#F6F1EB',
            border: !selectedId ? '2px solid #2D6A4F' : '1px solid #E8E0D8',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#555555',
          }}
        >
          画像なし
        </button>
      </div>
      {photos.length > 0 && (
        <p className="mt-2 text-[10px] text-text-light">
          Powered by{' '}
          <a
            href="https://unsplash.com/?utm_source=WordShare&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  );
}
