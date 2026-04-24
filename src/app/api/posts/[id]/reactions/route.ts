// /api/posts/[id]/reactions — semantic reactions (got_it / tough_one / useful)
// POST: toggle reaction for the authenticated user
// GET : return aggregate counts + my_reactions list

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';
import type { ReactionType, ReactionCounts } from '@/lib/types';

const VALID_TYPES: ReactionType[] = ['got_it', 'tough_one', 'useful'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type } = body;
  if (!type || !VALID_TYPES.includes(type as ReactionType)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
  }

  // Try insert — UNIQUE violation → toggle off via delete
  const { data: inserted, error: insertError } = await supabase
    .from('post_reactions')
    .insert({ post_id: params.id, user_id: user.id, type })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const { error: deleteError } = await supabase
        .from('post_reactions')
        .delete()
        .match({ post_id: params.id, user_id: user.id, type });
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: 'removed' });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, action: 'added', reaction: inserted });
}

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
    .from('post_reactions')
    .select('type, user_id')
    .eq('post_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: ReactionCounts = { got_it: 0, tough_one: 0, useful: 0 };
  const myReactions = new Set<ReactionType>();

  for (const row of data ?? []) {
    const t = row.type as ReactionType;
    if (!VALID_TYPES.includes(t)) continue;
    counts[t] += 1;
    if (row.user_id === user.id) myReactions.add(t);
  }

  return NextResponse.json({
    counts,
    my_reactions: Array.from(myReactions),
  });
}
