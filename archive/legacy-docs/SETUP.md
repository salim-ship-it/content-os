# API Setup Guide

This guide walks through setting up all the APIs for Content OS. **Only Anthropic and Supabase are required.** All other APIs are optional but unlock additional features.

## Required APIs (Must Have)

### 1. Anthropic Claude API
Claude powers all content generation, analysis, and coaching.

**Setup:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click "API Keys" in the left sidebar
4. Create a new key
5. Copy the key into `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxx...
   ```

**Cost:** Pay-as-you-go. Free $5/month credit for new accounts.

**Used for:** 
- Chat interface
- Content generation (ideas, post writing)
- Post scoring and feedback
- Lead magnet creation

---

### 2. Supabase Database
Supabase stores all your content, sources, and profiles.

**Setup:**
1. Go to https://supabase.com/
2. Sign up or log in
3. Create a new project
4. Go to Project Settings → API
5. Copy these into `.env.local`:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ```

**Cost:** Free tier includes 500MB storage, perfect for starting.

**Used for:**
- Storing posts and content
- Saving sources (LinkedIn, Reddit, Instagram, YouTube)
- Storing voice profiles and creator styles
- Tracking lead magnets

---

## Optional APIs (Enhanced Features)

### 3. Apify Web Scraping
Automatically scrape trending content from LinkedIn, Reddit, Twitter.

**Setup:**
1. Go to https://apify.com/
2. Sign up (free tier available)
3. Go to Account → API token
4. Copy into `.env.local`:
   ```
   APIFY_TOKEN=apify_api_xxxx...
   ```

**Cost:** Free tier gives 2,400 platform credits/month.

**Used for:**
- Scraping trending LinkedIn posts
- Finding Reddit discussions
- Mining Twitter/X trends
- Building swipe file automatically

**Actors needed:**
- `harvestapi/linkedin-post-search`
- `harvestapi/linkedin-profile-posts`
- `parseforge/reddit-posts-scraper`

---

### 4. OpenRouter (Alternative AI Provider)
Use Claude via OpenRouter for generating ideas and comments.

**Setup:**
1. Go to https://openrouter.ai/
2. Sign up or log in
3. Go to Keys section
4. Create a new key
5. Copy into `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-xxxxx...
   ```

**Cost:** Pay-as-you-go (often cheaper than direct API).

**Used for:**
- Generating 5 post ideas from a keyword
- Comment generation for social engager
- Alternative to Anthropic API

---

### 5. vidIQ (YouTube/Instagram Mining)
Mine proven video titles from YouTube and Instagram reels.

**Setup:**
1. Go to https://vidiq.com/
2. Sign up for Boost plan or higher
3. Go to Account → Integrations
4. Find the API token
5. Copy into `.env.local`:
   ```
   VIDIQ_API_KEY=vidiq_xxxxx...
   ```

**Cost:** Requires Boost plan ($30+/month). Uses credits (5 per call, 20 for full mining run).

**Used for:**
- Analyzing YouTube video titles
- Finding Instagram Reels that perform well
- Extracting proven hook patterns
- Generating 5 ready-to-publish posts from trends

---

### 6. Clay (Data Enrichment)
Enrich company and person data with Clay.

**Setup:**
1. Go to https://clay.com/
2. Sign up or log in
3. Go to Account → API
4. Create a token
5. Copy into `.env.local`:
   ```
   CLAY_API_KEY=clay_xxxxx...
   ```

**Cost:** Free tier available, paid plans start at $99/month.

**Used for:**
- Enriching company data from sources
- Getting founder/decision-maker info
- Finding signals for outbound

---

## Configuration File

All APIs are configured in `config/apis.ts`. This file:
- Validates which APIs are set up
- Provides status of each API
- Offers helper functions to get API keys

**Check API status:**
```bash
node -e "const {checkRequiredApis} = require('./config/apis'); console.log(checkRequiredApis())"
```

---

## Quick Start (Minimum Setup)

To get Content OS running immediately:

1. **Copy the template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add required APIs:**
   - Get `ANTHROPIC_API_KEY` from https://console.anthropic.com/
   - Get `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from https://supabase.com/

3. **Start the app:**
   ```bash
   npm install
   npm run dev
   ```

That's it! All other APIs are optional.

---

## Feature Matrix

| Feature | Required APIs | Optional APIs |
|---------|---|---|
| Chat & content generation | Anthropic | — |
| Save sources | Supabase | — |
| Store posts | Supabase | — |
| Scrape LinkedIn/Reddit trends | Supabase | Apify |
| Comment generation | Anthropic | OpenRouter |
| Lead magnet creation | Anthropic | — |
| Score your posts | Anthropic | — |
| Mine YouTube/Instagram outliers | — | vidIQ |
| Generate ideas from trends | Anthropic | OpenRouter |
| Enrich company data | — | Clay |

---

## Troubleshooting

**"ANTHROPIC_API_KEY not found"**
- Make sure `.env.local` exists in the root directory
- Check that the key starts with `sk-ant-`
- Verify there are no extra spaces

**"Supabase connection failed"**
- Check that `SUPABASE_URL` starts with `https://`
- Verify the URL matches your project (check in Supabase dashboard)
- Make sure `SUPABASE_SERVICE_KEY` is the service role key, not the anon key

**"Apify actor not found"**
- Verify the actor name is spelled correctly
- Make sure your Apify account has credits
- Check that the token is valid

---

## Security

Never commit `.env.local` to Git. It's already in `.gitignore`.

When deploying to production (Vercel, Railway, etc.):
1. Add environment variables in the hosting dashboard
2. Don't paste `.env.local` — copy each key individually
3. Use the same key names as in `.env.local`

---

## Next Steps

1. Set up the required APIs above
2. Go to `/onboarding/voice` to create your voice profile
3. Go to `/onboarding/creators` to add creators to study
4. Start creating content in the chat!
