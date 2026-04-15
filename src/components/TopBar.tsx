'use client';

import { Button } from '@/components/ui/Button';
import type { ReactNode } from 'react';

export function TopBar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-primary">WordShare</p>
        <h1 className="mt-2 font-display text-3xl text-text">{title}</h1>
        <p className="mt-2 text-sm text-text-mid">{subtitle}</p>
      </div>
      {action ?? <Button variant="ghost">Together</Button>}
    </header>
  );
}
