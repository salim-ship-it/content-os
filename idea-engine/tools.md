# Idea Engine — Tools

Tools and platforms used to find, pull, and analyze content for the idea engine.

---

## 1. Monial (LinkedIn Profile Tracker)

**What it does:** Tracks LinkedIn profiles and automatically syncs their posts daily.

**When to use:** Ongoing monitoring of creators in `sources.md`.

**Status:** Set up but LinkedIn crawl returning empty results (as of 2026-03-31). May need Monial support.

**How to use via Claude Code:**
1. Add a tracker: `tracker_tool → create → LINKEDIN_PROFILE_POSTS`
2. Fetch posts: `fetch_posts → filter by profile → set date range`
3. Search posts: `search_posts → keyword search across all tracked profiles`

**Tracked profiles:**
- Charles Tenot — `linkedin.com/in/charlestenot` (added 2026-03-31)

**To add:** Michel Lieben, Alex Vacca, Shawn Tenam, Matteo Tittarelli, Varun Anand, Othman Bekhadri

---

## 2. Apify (LinkedIn Post Scraper)

**What it does:** Scrapes LinkedIn profile posts with full engagement data (likes, comments, shares).

**When to use:** When you need a one-time pull of top posts from a creator — especially when Monial fails or you need historical data.

**How to run:**

```bash
# Token lives in repo root .env.local as APIFY_API_TOKEN

node content-os/idea-engine/scripts/pull-linkedin-posts.mjs
node content-os/idea-engine/scripts/process-winning-posts.mjs --input .tmp/content-automation/raw/othmane-khadri-YYYY-MM-DD.json
node content-os/idea-engine/scripts/generate-draft-queue.mjs
```

**Apify actor to use:** `harvestapi/linkedin-profile-posts`

**Output:** JSON files saved in `.tmp/content-automation/raw/` with post text, likes, comments, shares, date.

---

## 3. Web Search (Fallback)

**What it does:** Searches the web for LinkedIn posts by a creator. Returns titles and links but not full content or engagement numbers.

**When to use:** Quick check when Monial and Apify aren't available. Good for spotting viral posts but not for full analysis.

**Limitations:**
- No engagement numbers (likes, comments, shares)
- No full post text
- Incomplete results (usually 10-20 posts max)

---

## 4. Reddit (via Web Search or Apify)

**What it does:** Pulls top posts from target subreddits.

**When to use:** Weekly scan of subreddits listed in `sources.md`.

**Subreddits:** r/sales, r/marketing, r/revops, r/startups, r/entrepreneur, r/ClaudeAI, r/GTMengineers

---

## Tool Priority

When you need to pull creator posts, try in this order:

1. **Monial** — if the profile is tracked and syncing
2. **Apify** — if you need full data with engagement numbers
3. **Web Search** — fallback for quick checks

---

## Scripts

All automation scripts live in `content-os/idea-engine/scripts/`.

| Script | What it does |
|---|---|
| `pull-linkedin-posts.mjs` | Pulls posts from every enabled creator in `watchlist.json` via Apify |
| `process-winning-posts.mjs` | Filters winning posts, updates the matching `winning-posts/*.md`, and logs fresh ideas |
| `generate-draft-queue.mjs` | Every 3 days, turns the best available idea into one ready-to-review draft in `draft-queue.md` |
| `review-draft-queue.mjs` | Approves, rejects, or marks a queued draft as posted |
| `run-content-pipeline.mjs` | End-to-end runner: pull → process → queue one draft |
