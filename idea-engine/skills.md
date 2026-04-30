
I # Idea Engine — Skills

Claude Code skills (slash commands) that automate idea engine tasks.

---

## Planned Skills

### /pull-posts
**What it does:** Pulls the top N posts from a LinkedIn creator in the last X days.
**Input:** Creator LinkedIn URL, number of posts, time range
**Output:** Ranked list of posts sorted by engagement, saved to `idea-capture.md` or output file
**Tools used:** Monial → Apify → Web Search (fallback chain)
**Status:** Not yet built

### /scan-sources
**What it does:** Scans all creators and newsletters in `sources.md` for new high-performing content.
**Input:** None (reads from `sources.md`)
**Output:** Summary of top posts from the past week across all tracked creators
**Tools used:** Monial, Web Search
**Status:** Not yet built

### /find-ideas
**What it does:** Takes a topic or keyword, searches across LinkedIn, Reddit, and newsletters for content ideas.
**Input:** Topic keyword (e.g. "cold email", "AI outbound")
**Output:** List of ideas with source links, filtered through the idea filtering rules in `sources.md`
**Tools used:** Monial search_posts, Web Search, Reddit search
**Status:** Not yet built

### /log-idea
**What it does:** Logs a new idea into `idea-capture.md` using the standard format.
**Input:** Source, original link, angle, format
**Output:** New entry added to `idea-capture.md`
**Tools used:** File write
**Status:** Not yet built

### /weekly-scan
**What it does:** Runs the full Monday morning workflow from `monitoring-workflow.md` — scans newsletters, subreddits, and creator posts, then logs the top 3-5 ideas.
**Input:** None
**Output:** 3-5 new ideas logged in `idea-capture.md`
**Tools used:** Monial, Web Search, Reddit
**Status:** Not yet built

---

## How to Build a Skill

Skills live in `/skills/` as `.md` files. Each skill is a Claude Code slash command.

To build one, create a file like `/skills/pull-posts.md` with:
- Clear trigger description
- Step-by-step instructions for Claude
- Which tools to use and in what order
- Where to save output
