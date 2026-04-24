// GET /api/unsplash/search?q=<query>
// Searches Unsplash for photos matching the query.

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';
import { searchUnsplashPhotos, isUnsplashEnabled } from '@/lib/unsplash/client';

export async function GET(request: NextRequest) {
  if (!isUnsplashEnabled()) {
    return NextResponse.json(
      { photos: [], disabled: true, error: 'UNSPLASH_ACCESS_KEY not set' },
      { status: 200 }
    );
  }

  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    const photos = await searchUnsplashPhotos(query, 3);

    const simplified = photos.map((p) => ({
      id: p.id,
      url: p.urls.regular,
      thumb: p.urls.small,
      alt: p.alt_description,
      download_location: p.links.download_location,
      credit: {
        photographer_name: p.user.name,
        photographer_url: `${p.user.links.html}?utm_source=WordShare&utm_medium=referral`,
        unsplash_url: `${p.links.html}?utm_source=WordShare&utm_medium=referral`,
      },
    }));

    return NextResponse.json({ photos: simplified });
  } catch (e) {
    console.error('Unsplash search error:', e);
    return NextResponse.json({ error: 'Search failed', photos: [] }, { status: 500 });
  }
}
