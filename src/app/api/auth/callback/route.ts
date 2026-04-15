import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/timeline';
  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerSupabaseClient(request, response);

  if (supabase && code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
