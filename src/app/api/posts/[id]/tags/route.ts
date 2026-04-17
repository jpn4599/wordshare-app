// GET  /api/posts/[id]/tags — List tags for a post
// POST /api/posts/[id]/tags — Add a user tag to a post

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('word_tags')
    .select('id, source, tag:tags(id, name, axis, color)')
    .eq('post_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tag_name, axis = 'general' } = (await request.json()) as {
    tag_name: string;
    axis?: string;
  };

  if (!tag_name?.trim()) {
    return NextResponse.json({ error: 'tag_name is required' }, { status: 400 });
  }

  // Upsert tag
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .upsert({ name: tag_name.trim(), axis }, { onConflict: 'name,axis' })
    .select()
    .single();

  if (tagError || !tag) {
    return NextResponse.json({ error: tagError?.message ?? 'Tag creation failed' }, { status: 500 });
  }

  // Upsert word_tag
  const { data: wordTag, error } = await supabase
    .from('word_tags')
    .upsert(
      { post_id: params.id, tag_id: tag.id, source: 'user' },
      { onConflict: 'post_id,tag_id' }
    )
    .select('id, source, tag:tags(id, name, axis, color)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ word_tag: wordTag });
}
