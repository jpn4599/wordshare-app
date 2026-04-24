// POST /api/unsplash/trigger-download
// Notifies Unsplash of a download per their API guidelines.

import { NextRequest, NextResponse } from 'next/server';
import { triggerUnsplashDownload } from '@/lib/unsplash/client';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { download_location?: string };
  const { download_location } = body;

  if (!download_location) {
    return NextResponse.json({ error: 'download_location required' }, { status: 400 });
  }

  await triggerUnsplashDownload(download_location);
  return NextResponse.json({ success: true });
}
