'use client';

// v2.2 Phase 8: useBadgeChecker
// Central hook that triggers server-side badge checks and surfaces
// newly-earned badges via a toast queue.

import { useCallback, useState } from 'react';

export interface EarnedBadge {
  id: string;
  name: string;
  icon: string;
}

export function useBadgeChecker() {
  const [queue, setQueue] = useState<EarnedBadge[]>([]);

  const checkBadges = useCallback(async () => {
    try {
      const res = await fetch('/api/me/badges', { method: 'POST' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        newly_earned?: string[];
        earned_details?: EarnedBadge[];
      };
      if (data.earned_details && data.earned_details.length > 0) {
        setQueue((prev) => [...prev, ...(data.earned_details ?? [])]);
      }
    } catch {
      // silent — badge checks are best-effort
    }
  }, []);

  const dismissFirst = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return { toast: queue[0] ?? null, checkBadges, dismissFirst };
}
