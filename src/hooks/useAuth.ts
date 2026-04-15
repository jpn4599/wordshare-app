'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const syncProfile = async (session: Session | null) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      void syncProfile(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncProfile(session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    supabase,
    user,
    profile,
    loading,
    configured,
  };
}
