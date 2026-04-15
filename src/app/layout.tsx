import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';

import './globals.css';

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'WordShare',
  description: '英単語を友達とシェアして、復習まで続けられる学習アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${bodyFont.variable} ${displayFont.variable} font-body`}>
        <main className="mx-auto min-h-screen max-w-[480px] px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
