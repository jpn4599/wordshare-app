// /api/me/badges
// GET:  badge progress list (earned + in-progress) for the current user
// POST: check & award any newly earned badges, return their ids

import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';

export async function GET() {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('get_user_badge_progress', {
    p_user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ badges: data ?? [] });
}

export async function POST() {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('check_and_award_badges', {
    p_user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const newlyEarned = ((data ?? []) as Array<{ newly_earned_badge_id: string }>).map(
    (r) => r.newly_earned_badge_id
  );

  // Fetch the details for toast rendering
  let earnedDetails: Array<{ id: string; name: string; icon: string }> = [];
  if (newlyEarned.length > 0) {
    const { data: defs } = await supabase
      .from('badge_definitions')
      .select('id, name, icon')
      .in('id', newlyEarned);
    earnedDetails = (defs ?? []) as typeof earnedDetails;
  }

  return NextResponse.json({ newly_earned: newlyEarned, earned_details: earnedDetails });
}
