// src/lib/unsplash/client.ts — Unsplash API client
// https://unsplash.com/documentation

const UNSPLASH_API = 'https://api.unsplash.com';

export interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string; thumb: string };
  user: { name: string; username: string; links: { html: string } };
  links: { html: string; download_location: string };
  alt_description: string | null;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

export function isUnsplashEnabled(): boolean {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY);
}

export async function searchUnsplashPhotos(
  query: string,
  perPage = 3
): Promise<UnsplashPhoto[]> {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY is not set');
  }

  const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&orientation=landscape`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  });

  if (!res.ok) {
    throw new Error(`Unsplash search failed: ${res.status}`);
  }

  const data = (await res.json()) as UnsplashSearchResponse;
  return data.results;
}

/** ダウンロードエンドポイントへの通知（Unsplash 規約） */
export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return;

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (e) {
    console.error('Unsplash download trigger failed:', e);
  }
}
