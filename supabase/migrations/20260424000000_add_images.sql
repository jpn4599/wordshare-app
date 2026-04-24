-- Phase 5: 画像投稿機能（Unsplash連携）
-- posts テーブルに画像関連カラムを追加

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT NULL
    CHECK (image_source IN ('unsplash', 'user_upload') OR image_source IS NULL),
  ADD COLUMN IF NOT EXISTS image_credit JSONB DEFAULT NULL;

COMMENT ON COLUMN posts.image_credit IS 'Unsplash credit info: { photographer_name, photographer_url, unsplash_url }';
