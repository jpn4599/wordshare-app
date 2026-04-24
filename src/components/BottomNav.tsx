'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/timeline', label: 'Timeline' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/stats', label: 'Stats' },
  { href: '/badges', label: 'Badges' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-4 mt-8 rounded-full border border-border bg-card/90 p-2 shadow-soft backdrop-blur">
      <ul className="flex items-center justify-between gap-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`block rounded-full px-4 py-3 text-center text-sm font-semibold transition ${
                  active ? 'bg-primary text-white' : 'text-text-mid hover:bg-primary-faded'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
