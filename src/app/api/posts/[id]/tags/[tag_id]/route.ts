// DELETE /api/posts/[id]/tags/[tag_id] — Remove a tag from a post
// PATCH  /api/posts/[id]/tags/[tag_id] — Change tag source (e.g. ai → ai_edited_by_user)

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; tag_id: string } }
) {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('word_tags')
    .delete()
    .eq('post_id', params.id)
    .eq('tag_id', params.tag_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; tag_id: string } }
) {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { source } = (await request.json()) as { source: string };

  const { data, error } = await supabase
    .from('word_tags')
    .update({ source })
    .eq('post_id', params.id)
    .eq('tag_id', params.tag_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ word_tag: data });
}
