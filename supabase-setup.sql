-- ============================================
-- 在 Supabase SQL Editor 中执行以下全部 SQL
-- ============================================

-- 1. 创建照片表（如果还没建）
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

-- 2. 新增：描述和标签列
ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN(tags);

-- 4. 启用 RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略（先删除旧策略再重建，避免冲突）
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
END $$;

CREATE POLICY "允许所有人查看照片" ON photos FOR SELECT USING (true);
CREATE POLICY "允许所有人上传照片" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人删除照片" ON photos FOR DELETE USING (true);
