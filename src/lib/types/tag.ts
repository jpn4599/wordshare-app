export type TagSource = 'ai' | 'user' | 'ai_edited_by_user';

export type TagAxis = 'general' | 'scene' | 'part_of_speech' | 'difficulty';

export interface Tag {
  id: string;
  name: string;
  axis: TagAxis;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface WordTag {
  id: string;
  post_id: string;
  tag_id: string;
  source: TagSource;
  created_at: string;
  updated_at: string;
  tag?: Tag;
}

export interface TagGenerationResult {
  word: string;
  tags: string[];
}
