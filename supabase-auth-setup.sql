-- ============================================
-- 认证系统 SQL — 在 Supabase SQL Editor 执行
-- ============================================

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, photo_id)
);

-- 3. 评论表加用户字段（如果还没加）
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_photo ON favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- 5. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 6. 策略
CREATE POLICY "允许所有人查看资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "允许用户创建自己的资料" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "允许所有人查看收藏" ON favorites FOR SELECT USING (true);
CREATE POLICY "用户管理自己的收藏" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户删除自己的收藏" ON favorites FOR DELETE USING (auth.uid() = user_id);
