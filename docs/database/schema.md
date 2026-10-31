# Content OS Database Schema

Copy and run these SQL commands in your Supabase project to set up the database.

## Create Tables

```sql
-- Users table (managed by Supabase Auth)
-- No need to create, Supabase handles this

-- User Sources (LinkedIn, Reddit, Newsletter, YouTube)
CREATE TABLE user_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('linkedin', 'reddit', 'newsletter', 'youtube')),
  name TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  max_posts INTEGER DEFAULT 1000,
  note TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, name, kind)
);

-- Content Posts (from all sources)
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('linkedin', 'reddit', 'newsletter', 'youtube')),
  type TEXT DEFAULT 'engagement',
  title TEXT,
  creator TEXT NOT NULL,
  date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  topic TEXT,
  why_it_worked TEXT,
  link TEXT UNIQUE,
  content TEXT,
  image_url TEXT,
  author_image_url TEXT
);

-- Indexes for better query performance
CREATE INDEX idx_content_posts_creator ON content_posts(creator);
CREATE INDEX idx_content_posts_source ON content_posts(source);
CREATE INDEX idx_content_posts_likes ON content_posts(likes DESC);
CREATE INDEX idx_user_sources_user_id ON user_sources(user_id);
CREATE INDEX idx_user_sources_kind ON user_sources(kind);

-- Enable Row Level Security (RLS)
ALTER TABLE user_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sources
CREATE POLICY "Users can view their own sources"
  ON user_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources"
  ON user_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources"
  ON user_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources"
  ON user_sources FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_posts (public read, authenticated write)
CREATE POLICY "Anyone can view posts"
  ON content_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON content_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

## Environment Variables Needed

Each user needs their own `.env.local`:

```
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_SERVICE_JWT=eyJhbGc...
SUPABASE_ANON_JWT=eyJhbGc...

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Other services (if needed)
NOTION_API_KEY=...
SLACK_BOT_TOKEN=...
etc.
```
