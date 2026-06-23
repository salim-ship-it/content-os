# Data Setup Guide

This guide explains how to share posts between Content OS instances without sharing personal data.

## What Gets Shared

**✅ Included in export:**
- All posts (from LinkedIn, Reddit, Instagram, YouTube)
- Creator information
- Engagement metrics (likes, comments, views)
- Post type and category

**❌ NOT included:**
- Voice profile (you create your own)
- Personal settings
- User configuration
- Account data

---

## Export Posts from Your Database

If you want to share your posts with someone else:

### Step 1: Run the export script

```bash
npx ts-node scripts/export-posts.ts
```

This creates a `posts-export.json` file with all your posts.

### Step 2: Share the file

Send `posts-export.json` to the person who wants to use it.

---

## Import Posts into New Database

If someone sends you a `posts-export.json` file:

### Step 1: Set up your Supabase

1. Create a free Supabase account at https://supabase.com/
2. Create a new project
3. Get your credentials:
   - `SUPABASE_URL` (Project URL in Settings > API)
   - `SUPABASE_SERVICE_KEY` (Service Role Key in Settings > API)

### Step 2: Create .env.local

```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
ANTHROPIC_API_KEY=your_key_here
```

### Step 3: Initialize database

The database tables will be created automatically when the app starts.

### Step 4: Import the posts

Place the `posts-export.json` file in your project root, then run:

```bash
npx ts-node scripts/import-posts.ts posts-export.json
```

### Step 5: Verify

1. Start the app: `npm run dev`
2. Go to `/ideas` 
3. You should see all the imported posts

---

## What Happens When You Import

1. ✅ All posts are imported into YOUR Supabase
2. ✅ New IDs are generated (no conflicts)
3. ✅ Your voice profile stays blank (you fill it in)
4. ✅ No personal data is transferred
5. ✅ Completely isolated from the original creator

---

## Example Workflow

**Person A (Creator):**
```bash
# Export their posts
npx ts-node scripts/export-posts.ts
# Creates: posts-export.json
# Send file to Person B
```

**Person B (Receiver):**
```bash
# Set up own Supabase account
# Add credentials to .env.local
# Import the posts
npx ts-node scripts/import-posts.ts posts-export.json
# Now has their own database with all the posts
# Can customize voice profile for themselves
```

---

## Troubleshooting

**"File not found"**
- Make sure `posts-export.json` is in the same directory as `package.json`

**"Missing SUPABASE credentials"**
- Check your `.env.local` file
- Verify the URL and key are correct

**"Import failed"**
- Make sure your Supabase project is set up
- Check that database tables exist (they're created on first app start)

**"No posts showing after import"**
- Go to `/ideas` and check the "All time" tab
- Refresh the page
- Check browser console for errors

---

## FAQ

**Q: Can I merge posts from multiple exports?**
A: Yes! Just run the import script multiple times with different export files.

**Q: Does importing affect my voice profile?**
A: No. Your voice profile is separate and stays blank until you fill it in.

**Q: Can I share sources with someone?**
A: Sources (LinkedIn profiles, Reddit communities, etc.) can be added manually in the Sources page. They're not included in the export.

**Q: What if I want a fresh start?**
A: Don't import any files. Your database starts empty, and you build your own swipe file over time.

---

## Database Schema

The export includes the `content_posts` table:

```
content_posts:
- id (UUID)
- title (text)
- content (text)
- creator (text)
- source (text) — linkedin, reddit, instagram, youtube
- type (text) — hot-take, story, educational, etc.
- likes (number)
- comments (number)
- reposts (number)
- saves (number)
- impressions (number)
- link (URL)
- published_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```
