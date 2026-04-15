import { getAvatarColor } from '@/lib/utils';

export function Avatar({
  name,
  color,
}: {
  name: string;
  color?: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const bg = color || getAvatarColor(name);

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {initial}
    </div>
  );
}
