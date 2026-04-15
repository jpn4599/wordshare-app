import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text outline-none transition placeholder:text-text-light focus:border-primary ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text outline-none transition placeholder:text-text-light focus:border-primary ${props.className ?? ''}`}
    />
  );
}
