// GET /api/me/streak — current user's streak + last 7 days activity
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';

export async function GET() {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('get_user_streak', { p_user_id: user.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json(
    result ?? { current_streak: 0, longest_streak: 0, last_7_days: [] }
  );
}
