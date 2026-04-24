'use client';

// v2.2 Phase 9: FeaturedWordCard — today's "Word of the day"

import { useEffect, useState } from 'react';

interface FeaturedWord {
  post_id: string;
  word: string;
  meaning: string;
  example: string | null;
  image_url: string | null;
  got_it_count: number;
  useful_count: number;
  poster_name: string;
  feature_date: string;
}

export function FeaturedWordCard() {
  const [featured, setFeatured] = useState<FeaturedWord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/featured')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setFeatured(d.featured ?? null);
      })
      .catch(() => {
        if (!cancelled) setFeatured(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !featured) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #EEEDFE 0%, #E6F1FB 100%)',
        border: '0.5px solid #E8E0D8',
        borderRadius: '14px',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: '#534AB7',
            letterSpacing: '0.5px',
            margin: 0,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          ⭐ Word of the day
        </p>
        <span style={{ fontSize: '11px', color: '#8B8B8B' }}>{featured.feature_date}</span>
      </div>

      {featured.image_url && (
        <div
          style={{
            width: '100%',
            aspectRatio: '4/3',
            overflow: 'hidden',
            borderRadius: '10px',
            marginBottom: '12px',
            background: '#F6F1EB',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featured.image_url}
            alt={featured.word}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ fontSize: '28px', fontWeight: 500, marginBottom: '2px', color: '#1B1B1B' }}>
        {featured.word}
      </div>
      <div style={{ fontSize: '14px', color: '#555555', marginBottom: '10px' }}>
        {featured.meaning}
      </div>
      {featured.example && (
        <p
          style={{
            fontSize: '13px',
            color: '#555555',
            fontStyle: 'italic',
            marginBottom: '14px',
            lineHeight: 1.5,
          }}
        >
          &ldquo;{featured.example}&rdquo;
        </p>
      )}
      <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#555555', flexWrap: 'wrap' }}>
        <span>
          ⭐ <b>{featured.got_it_count}</b> Got it
        </span>
        <span>
          💡 <b>{featured.useful_count}</b> Useful
        </span>
        <span>投稿者 · {featured.poster_name}</span>
      </div>
    </div>
  );
}
