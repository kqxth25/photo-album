-- ============================================
-- 在 Supabase SQL Editor 中执行以下全部 SQL
-- (IF NOT EXISTS 确保可重复执行)
-- ============================================

-- 1. 创建照片表
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 描述和标签列
ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 5. RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 6. RLS 策略（先删后建）
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = '允许所有人查看照片' AND tablename = 'photos') THEN
    DROP POLICY "允许所有人查看照片" ON photos;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = '允许所有人上传照片' AND tablename = 'photos') THEN
    DROP POLICY "允许所有人上传照片" ON photos;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = '允许所有人删除照片' AND tablename = 'photos') THEN
    DROP POLICY "允许所有人删除照片" ON photos;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = '允许所有人查看评论' AND tablename = 'comments') THEN
    DROP POLICY "允许所有人查看评论" ON comments;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = '允许所有人发表评论' AND tablename = 'comments') THEN
    DROP POLICY "允许所有人发表评论" ON comments;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = '允许所有人删除评论' AND tablename = 'comments') THEN
    DROP POLICY "允许所有人删除评论" ON comments;
  END IF;
END $$;

CREATE POLICY "允许所有人查看照片" ON photos FOR SELECT USING (true);
CREATE POLICY "允许所有人上传照片" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人删除照片" ON photos FOR DELETE USING (true);

CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "允许所有人发表评论" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人删除评论" ON comments FOR DELETE USING (true);
