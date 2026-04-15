import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({
  className = '',
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-[28px] border border-border bg-card p-5 shadow-soft ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
