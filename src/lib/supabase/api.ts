// src/lib/supabase/api.ts — Supabase clients for use in API route handlers

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * User-authenticated client for API routes.
 * Uses the user's session cookie to enforce RLS policies.
 */
export function createAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Route handlers cannot set response cookies via this helper
        },
        remove() {
          // Route handlers cannot remove response cookies via this helper
        },
      },
    }
  );
}

/**
 * Service-role admin client — bypasses RLS.
 * Use only for server-side operations (batch jobs, background tasks).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
