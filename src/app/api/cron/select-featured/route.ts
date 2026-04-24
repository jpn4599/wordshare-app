// v2.2 Phase 9: Daily cron to select "Word of the Day"
// Runs every morning (see vercel.json). Protected by CRON_SECRET — the
// Vercel Cron scheduler sends `Authorization: Bearer <CRON_SECRET>`.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/api';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('select_featured_word');

  if (error) {
    console.error('select_featured_word failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post_id: data ?? null });
}
