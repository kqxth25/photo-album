-- 在 Supabase SQL Editor 中执行以下 SQL

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

-- 2. 启用 RLS（行级安全）
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 3. 创建策略：允许所有人读取
CREATE POLICY "允许所有人查看照片"
  ON photos FOR SELECT
  USING (true);

-- 4. 创建策略：允许所有人插入（服务端用 service_role 绕过）
CREATE POLICY "允许所有人上传照片"
  ON photos FOR INSERT
  WITH CHECK (true);

-- 5. 创建策略：允许所有人删除
CREATE POLICY "允许所有人删除照片"
  ON photos FOR DELETE
  USING (true);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
