// GET /api/tags?popular=true&limit=5 — List tags (optionally by popularity)

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createAdminClient } from '@/lib/supabase/api';

export async function GET(request: NextRequest) {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const popular = searchParams.get('popular') === 'true';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  if (popular) {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('get_popular_tags', { p_limit: limit });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tags: data ?? [] });
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: data });
}
