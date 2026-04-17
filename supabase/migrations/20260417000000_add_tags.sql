-- ============================================
-- WordShare v2.1 Migration: Add Tag Feature
-- Adapted for posts/profiles schema (no groups)
-- ============================================

-- 1. tags テーブル（グローバル共有タグプール）
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  axis TEXT NOT NULL DEFAULT 'general',
  color TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, axis)
);

CREATE INDEX idx_tags_axis ON tags(axis);
CREATE INDEX idx_tags_name ON tags(name);

-- 2. word_tags 中間テーブル（posts と tags を繋ぐ）
CREATE TABLE word_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('ai', 'user', 'ai_edited_by_user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_word_tags_post_id ON word_tags(post_id);
CREATE INDEX idx_word_tags_tag_id ON word_tags(tag_id);
CREATE INDEX idx_word_tags_source ON word_tags(source);

-- 3. posts テーブルにタグ付け状態カラム追加
ALTER TABLE posts
  ADD COLUMN tagging_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (tagging_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN tagged_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_posts_tagging_status ON posts(tagging_status);

-- 4. RLS ポリシー
-- tags: 認証済みユーザー全員が読み書き可能（グループなしの共有アプリ）
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select_authenticated"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tags_insert_authenticated"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tags_update_authenticated"
  ON tags FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "tags_delete_authenticated"
  ON tags FOR DELETE
  TO authenticated
  USING (true);

-- word_tags: 認証済みユーザー全員が読み書き可能
ALTER TABLE word_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "word_tags_all_authenticated"
  ON word_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_word_tags_updated_at
  BEFORE UPDATE ON word_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE word_tags;

-- 7. 人気タグ取得 RPC
CREATE OR REPLACE FUNCTION get_popular_tags(p_limit INT)
RETURNS TABLE(id UUID, name TEXT, axis TEXT, usage_count BIGINT) AS $$
  SELECT t.id, t.name, t.axis, COUNT(wt.id) as usage_count
  FROM tags t
  LEFT JOIN word_tags wt ON t.id = wt.tag_id
  GROUP BY t.id
  ORDER BY usage_count DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;
