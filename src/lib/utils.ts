// src/lib/utils.ts — Shared utility functions

/**
 * Human-readable relative time (Japanese).
 */
export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;

  return new Date(dateString).toLocaleDateString('ja-JP');
}

/**
 * Deterministic avatar color from username.
 */
const AVATAR_COLORS = [
  '#2D6A4F', '#E76F51', '#457B9D', '#6A4C93',
  '#E09F3E', '#264653', '#E63946',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Calculate learning streak (consecutive days with activity).
 */
export function calculateStreak(activityDates: Date[]): number {
  const dateSet = new Set(activityDates.map((d) => d.toDateString()));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dateSet.has(d.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get day names for weekly chart.
 */
export function getWeekData(
  postDates: string[]
): { day: string; count: number; isToday: boolean }[] {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const count = postDates.filter(
      (pd) => new Date(pd).toDateString() === dateStr
    ).length;
    result.push({
      day: dayNames[d.getDay()],
      count,
      isToday: i === 0,
    });
  }

  return result;
}

/**
 * Shuffle array (Fisher-Yates).
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
