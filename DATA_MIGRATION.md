# Data Migration Guide

How to export all your data and share it with another person.

## For YOU (Data Owner)

### Step 1: Export your data

```bash
npx ts-node scripts/export-backup.ts
```

This creates `content-os-backup.json` with:
- All your sources (LinkedIn, Reddit, Newsletter, YouTube creators)
- All your posts (86 ColdIQ posts + any others)
- Complete metadata

### Step 2: Share the backup file

Send `content-os-backup.json` to the other person via:
- Email
- Cloud storage (Google Drive, Dropbox)
- GitHub (add to a private repo)
- Any file sharing service

---

## For THEM (New User)

### Step 1: Set up their own Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get their credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY` (from Settings > API)

### Step 2: Set up database schema

In their Supabase SQL Editor, run:

```sql
-- User Sources
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

-- Content Posts
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

-- Indexes
CREATE INDEX idx_content_posts_creator ON content_posts(creator);
CREATE INDEX idx_content_posts_source ON content_posts(source);
CREATE INDEX idx_content_posts_likes ON content_posts(likes DESC);
CREATE INDEX idx_user_sources_user_id ON user_sources(user_id);

-- Enable RLS
ALTER TABLE user_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

CREATE POLICY "Anyone can view posts"
  ON content_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON content_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### Step 3: Clone the repo and set up .env.local

```bash
git clone <repo-url>
cd content-os
npm install
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-your-key
SUPABASE_DB_PASSWORD=your-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_SERVICE_JWT=eyJ...
SUPABASE_ANON_JWT=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 4: Import the backup data

Place `content-os-backup.json` in the repo root, then:

```bash
npx ts-node scripts/import-backup.ts content-os-backup.json
```

This imports:
- ✅ All sources
- ✅ All posts (86 ColdIQ posts + any others)
- ✅ All metadata (likes, comments, dates, etc.)

### Step 5: Start the app

```bash
npm run dev
```

Open http://localhost:3000 and login with their account. They'll see all the imported sources and posts in their Swipe File!

---

## What Gets Migrated

✅ **Sources**: All your LinkedIn creators, Reddit communities, Newsletters, YouTube channels
✅ **Posts**: All content posts with:
  - Title/hook
  - Creator name
  - Engagement metrics (likes, comments, reposts)
  - Full content
  - Dates
  - Images URLs
  - Topics/notes

❌ **NOT Exported** (They set up their own):
  - Voice profile / Brand voice
  - User accounts & authentication
  - API keys (each person gets their own Claude API)
  - Personal settings & preferences

---

## Verification

After import, check:

```bash
npx ts-node scripts/show-all-posts.ts
```

Should show all sources and posts from your backup.
