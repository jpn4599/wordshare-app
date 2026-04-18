// GET /api/posts/tags/status
// Returns tagging status counts for all posts

import { NextResponse } from 'next/server';
import { createAuthClient, createAdminClient } from '@/lib/supabase/api';

export async function GET() {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get counts grouped by tagging_status
  const { data, error } = await admin
    .from('posts')
    .select('tagging_status')
    .order('tagging_status');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: data?.length ?? 0,
  };

  for (const row of data ?? []) {
    const status = row.tagging_status ?? 'pending';
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
