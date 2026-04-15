import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-light',
  secondary: 'bg-primary-faded text-primary hover:bg-[#c9ebd3]',
  ghost: 'bg-transparent text-text-mid hover:bg-black/5',
  accent: 'bg-accent text-white hover:bg-accent-light',
};

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
