-- =============================================
-- Content OS: Multi-tenant migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================

-- 1. Voice profiles (replaces voice-draft.json + voice-profile.md on disk)
CREATE TABLE IF NOT EXISTS user_voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft JSONB,
  profile_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Content pillars (replaces pillars-draft.json + content-pillars.md on disk)
CREATE TABLE IF NOT EXISTS user_pillars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft JSONB,
  pillars_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Onboarding state (replaces onboarding.json on disk)
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. Sources/watchlist (replaces watchlist.json on disk)
CREATE TABLE IF NOT EXISTS user_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  max_posts INTEGER DEFAULT 10,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Ideas (replaces idea-capture.md on disk)
CREATE TABLE IF NOT EXISTS user_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  source TEXT,
  original TEXT,
  angle TEXT,
  format TEXT,
  status TEXT DEFAULT 'raw',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Creator profiles cache (replaces creator-profiles.json on disk)
CREATE TABLE IF NOT EXISTS user_creator_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_url TEXT,
  image_url TEXT,
  headline TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- 7. Add user_id to existing tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_posts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_posts' AND column_name = 'user_id') THEN
      ALTER TABLE content_posts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'published_posts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'published_posts' AND column_name = 'user_id') THEN
      ALTER TABLE published_posts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see/edit their own data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_creator_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies: each user can only access their own rows
CREATE POLICY "Users can view own voice profiles" ON user_voice_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice profiles" ON user_voice_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice profiles" ON user_voice_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pillars" ON user_pillars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pillars" ON user_pillars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pillars" ON user_pillars FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own onboarding" ON user_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON user_onboarding FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sources" ON user_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sources" ON user_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sources" ON user_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sources" ON user_sources FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ideas" ON user_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ideas" ON user_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON user_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON user_ideas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own creator profiles" ON user_creator_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own creator profiles" ON user_creator_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creator profiles" ON user_creator_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own creator profiles" ON user_creator_profiles FOR DELETE USING (auth.uid() = user_id);

-- RLS for existing tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_posts') THEN
    ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_posts' AND policyname = 'Users can view own content posts') THEN
      EXECUTE 'CREATE POLICY "Users can view own content posts" ON content_posts FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert own content posts" ON content_posts FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update own content posts" ON content_posts FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'published_posts') THEN
    ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'published_posts' AND policyname = 'Users can view own published posts') THEN
      EXECUTE 'CREATE POLICY "Users can view own published posts" ON published_posts FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert own published posts" ON published_posts FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update own published posts" ON published_posts FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
  END IF;
END $$;
