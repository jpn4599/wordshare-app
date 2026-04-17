import { getAvatarColor } from '@/lib/utils';

export function Avatar({
  name,
  color,
  size,
}: {
  name: string;
  color?: string | null;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const bg = color || getAvatarColor(name);
  const px = size ?? 44;

  return (
    <div
      className="flex items-center justify-center rounded-2xl text-sm font-bold text-white"
      style={{ backgroundColor: bg, width: px, height: px, flexShrink: 0 }}
    >
      {initial}
    </div>
  );
}
