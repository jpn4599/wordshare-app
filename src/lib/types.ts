// src/lib/types.ts — WordShare Type Definitions
import type { Tag, TagSource } from '@/lib/types/tag';

export interface Profile {
  id: string;
  username: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  word: string;
  meaning: string;
  example: string;
  episode: string;
  created_at: string;
  updated_at: string;
  // v2.1: tagging
  tagging_status?: 'pending' | 'processing' | 'completed' | 'failed';
  tagged_at?: string | null;
  // Joined fields
  author_name?: string;
  author_color?: string;
  reactions?: Reaction[];
  comments?: Comment[];
  comment_count?: number;
  reaction_count?: number;
}

/** Post with tag information loaded */
export interface PostWithTags extends Post {
  tags: Array<Tag & { source: TagSource }>;
}

export type { Tag, TagSource };

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: '👍' | '🔥' | '💡' | '❤️';
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  text: string;
  created_at: string;
  // Joined
  author_name?: string;
  author_color?: string;
}

export interface SRSCard {
  id: string;
  user_id: string;
  post_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  last_result: 'correct' | 'incorrect' | null;
  created_at: string;
  updated_at: string;
}

export interface QuizHistoryEntry {
  id: string;
  user_id: string;
  post_id: string;
  mode: 'en2jp' | 'jp2en';
  correct: boolean;
  created_at: string;
}

export interface QuizQuestion {
  post: Post;
  question: string;
  answer: string;
  options: string[];
  srsCard: SRSCard;
  isDue: boolean;
}

export interface SessionResult {
  word: string;
  meaning: string;
  correct: boolean;
  nextReviewDays: number;
}

export type ReactionEmoji = '👍' | '🔥' | '💡' | '❤️';
export const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '🔥', '💡', '❤️'];
