# Idea Engine — Workflows

Step-by-step workflows that connect sources → tools → idea capture → winning posts → content.

---

## Workflow 1: Pull & Categorize Creator Posts

**When:** Weekly (Monday) or when adding a new creator to monitor
**Time:** 10 minutes
**Tools:** Apify, Claude Code

### Steps

1. **Pick the creator** from `sources.md`
2. **Tell Claude Code:**
   > "Pull the top 50 posts from [creator LinkedIn URL] using Apify"
3. Claude runs the Apify scraper (`harvestapi/linkedin-profile-posts`)
4. **Review the results** — Claude shows top posts ranked by engagement
5. **Claude categorizes each post** into the right file under `winning-posts/`:
   - `hot-takes.md` — bold opinions, contrarian
   - `stories.md` — personal narratives
   - `case-studies.md` — real examples, teardowns
   - `educational.md` — how-tos, playbooks
   - `insightful.md` — leadership, observations
   - `transparency.md` — business metrics, updates
   - `announcements.md` — news, launches
   - `engagement.md` — teasers, promos
6. **Update `memory.md`** — any new hook patterns? Post types shifting?
7. **Log ideas** — any posts that spark your own angle? Add to `idea-capture.md`

### Output
- Winning posts database updated with new creator
- Memory updated with new patterns
- 2-5 new ideas logged

---

## Workflow 2: Content Debrief (Automated, Every 3 Days)

**When:** Every 3 days at 9:17am (automated via Slack DM)
**Time:** 5 minutes to respond
**Tools:** Slack, Claude Code
**Trigger:** Remote agent — `trig_01NhtmSfNigV7meVaoyLYPw5`
**Manage:** https://claude.ai/code/scheduled/trig_01NhtmSfNigV7meVaoyLYPw5

### How it works

1. **You get a Slack DM** every 3 days at 9:17am with one question
2. Questions rotate through 3 sets:
   - **Set A — What happened:** What did you learn, ship, or notice? What surprised you? What would you say over coffee?
   - **Set B — Relationships & deals:** Who made you think? What did you win or lose? What advice did you give?
   - **Set C — Industry & opinions:** What trend is wrong? What tool do most people not know about? One message to your industry?
3. **You reply in Slack** — raw, unfiltered, 2-3 sentences is enough
4. **Next time you open Claude Code**, say: "process my debrief"
5. Claude reads your Slack reply, extracts 2-3 content seeds, and logs them to `idea-capture.md`

### Rules
- Reply within 24 hours while it's fresh
- Don't overthink — raw answers make the best content
- Push for the uncomfortable answer — best content lives there

---

## Workflow 2B: Draft Queue (Automated, Every 3 Days)

**When:** Every 3 days, early morning
**Time:** 2 minutes to review
**Tools:** Apify, local Node scripts, `draft-queue.md`

### How it works

1. Run the pipeline:
   > `node content-os/idea-engine/scripts/run-content-pipeline.mjs`
2. The pull script fetches fresh creator posts from `watchlist.json`
3. The processor updates the matching files under `winning-posts/` and logs new ideas into `idea-capture.md`
4. The generator checks if 3 days have passed since the last draft
5. If due, it adds one ready-to-review draft to `draft-queue.md`
6. You open the queue and mark the draft `approved` or `rejected`

### Output
- Winning posts refreshed
- Idea log refreshed
- One new review-ready post in the queue every 3 days

---

## Workflow 3: Daily Idea Capture (5 min)

**When:** Every day, end of day
**Time:** 5 minutes
**Tools:** LinkedIn feed, `sources.md` creators

### Steps

1. **Scan your LinkedIn feed** — focus on creators in `sources.md`
2. **Spot anything with 500+ likes** or that sparks a reaction? Screenshot it or copy the link
3. **Tell Claude Code:**
   > "Log this idea: [paste link or describe what you saw]"
4. Claude adds it to `idea-capture.md` using this format:

```
---
Date: YYYY-MM-DD
Source: [creator name]
Original: [link or description]
My angle: [how you'd adapt it for your audience]
Format: [hot take / story / case study / educational / insightful]
Status: idea
```

5. **If the original post is a banger** (200+ likes), also add it to the right `winning-posts/` file

### Rules
- Don't overthink the angle — raw is fine, you'll refine later
- Minimum 1 idea per day, aim for 2-3
- If you can't find anything, run Workflow 6 (active research)

---

## Workflow 4: Weekly Content Scan (Monday, 20 min)

**When:** Every Monday morning
**Time:** 20 minutes
**Tools:** Newsletters, Reddit, Apify, Claude Code

### Steps

1. **Read newsletters** that arrived this week (list in `sources.md`)
   - For each newsletter, ask: "What's the one insight my audience doesn't know yet?"
   - Log any ideas to `idea-capture.md`

2. **Scan Reddit** — check top posts from the week in target subreddits
   - Tell Claude: "Search Reddit for top posts this week in r/sales, r/revops, r/ClaudeAI about [topic]"
   - Pain points = content ideas. Questions = post angles.

3. **Pull new creator posts** if you haven't this week
   - Pick 1-2 creators from `sources.md`
   - Run Workflow 1 on them

4. **Review idea-capture.md**
   - How many ideas banked this week?
   - Pick 2-3 to turn into posts this week
   - Mark those as `Status: drafting`

5. **Check memory.md**
   - What post type is performing best right now?
   - Prioritize ideas that match the winning type

### Output
- 3-5 new ideas logged
- 2-3 ideas picked for this week's posts
- Winning posts database refreshed

---

## Workflow 5: Idea → Post Pipeline

**When:** When you're ready to write a post
**Time:** 20-25 minutes
**Tools:** `idea-capture.md`, `winning-posts/`, `memory.md`, `/skills/post-scorer/`, `/skills/human-writer/`

### Steps

1. **Pick an idea** from `idea-capture.md` (prioritize `Status: drafting` or 🔴 urgency)

2. **Check winning-posts/ for the matching type**
   - Writing a hot take? Read `hot-takes.md` — what hooks worked?
   - Writing a case study? Read `case-studies.md` — what structure got engagement?

3. **Check the rules**
   - `memory.md` — current hook patterns, CTA patterns
   - `linkedin-rules/viral-posts.md` — anti-AI rules + storytelling rule + audit framework

4. **Write the first draft** using what you learned:
   - Hook from the winning pattern (under 10 words, specific, no warmup)
   - Structure from the matching category
   - One personal moment with a real number or time period
   - One specific CTA question that drives comments (not "what do you think?")

5. **Run `/score` on the draft**
   - The post-scorer skill rates 6 dimensions: AI smell, hook, CTA, format, structure, storytelling
   - Aim for ≥ 45/60 before publishing
   - It returns 1 fix per dimension + the biggest win

6. **Apply the biggest win first** — usually it's adding a personal moment (storytelling) or adding a CTA. These two fixes alone often lift a post by 10-15 points.

7. **If AI Smell score is 4+, run `/human`**
   - The human-writer skill quotes the exact lines that sound like AI
   - It names the banned pattern (#1 through #10)
   - It rewrites the worst line with before/after

8. **Re-score and iterate** until you hit ≥ 45/60.

9. **(Optional) Generate a meme** if the post is a hot take or has bell-curve potential
   - Use `/content-os/post-database/linkedin-rules/viral-memes/generate.py` — see `linkedin-rules/viral-memes/README.md` for the bell curve playbook
   - Keep labels short. Strip speech bubbles. Always proofread before posting.

10. **Update `idea-capture.md`** — change status to `Status: published` and add the date

11. **After 48 hours, log results:**

```
Date published: YYYY-MM-DD
Likes: X | Comments: X | Reposts: X
Final score before publishing: X/60
What worked: [1 sentence]
What to do differently: [1 sentence]
```

12. **Update `memory.md`** if you learn something new about what works
    - Did a 50+ score post still flop? Add a new rule.
    - Did a 35 score post fly? Figure out why and update the scorer.

---

## Workflow 6: Active Research (When You're Stuck)

**When:** Can't find ideas, need inspiration fast
**Time:** 10 minutes
**Tools:** Web search, Reddit, Claude Code

### Steps

1. **Tell Claude Code:**
   > "Find content ideas about [topic] from LinkedIn, Reddit, and Hacker News in the last 7 days"

2. Claude searches using the patterns from `sources.md`:
   - `"[topic] site:reddit.com" [current month]`
   - `"[topic] overrated OR unpopular opinion OR hot take"`
   - `"[topic] struggling OR broken OR frustrating"`

3. **Filter results** using the idea filtering rules from `sources.md`:
   - Relevant to your audience?
   - Timely or evergreen?
   - Is there tension or a contrarian angle?
   - Is everyone already saying this? Find the gap.

4. **Log the best 3-5 ideas** to `idea-capture.md`

5. **Bonus — competitor post analysis:**
   > "Pull top posts from [competitor LinkedIn URL] — what are they talking about that I'm not?"

---

## Workflow 8: Audit & Polish a Draft

**When:** You have a draft (yours or written elsewhere) and want to polish it before publishing
**Time:** 5-10 minutes
**Tools:** `/skills/post-scorer/`, `/skills/human-writer/`, `winning-posts/`

This is the standalone version of steps 5-8 in Workflow 5. Use it when the draft already exists and you just need to sharpen it.

### Steps

1. **Paste the draft into Claude Code with `/score`**
   - Get the 6-dimension audit (AI smell, hook, CTA, format, structure, storytelling)
   - Get the overall score out of 60
   - Get 1 fix per dimension + the biggest win

2. **Identify the lowest-scoring dimension**
   - Most common gaps: storytelling (3/10), CTA (1/10), AI smell (6/10)
   - Fix the lowest one first — it's the easiest jump

3. **If AI Smell ≥ 4, run `/human`**
   - The skill quotes the exact lines that sound like AI
   - It tells you which banned pattern they hit (1-10)
   - It rewrites the worst line with before/after

4. **Apply fixes one at a time**
   - Don't rewrite everything in one pass — you'll lose your voice
   - Make one change, re-read it out loud, then move to the next

5. **Re-score**
   - Run `/score` again to confirm the change improved the post
   - Stop when you hit 45/60 or higher
   - Don't chase 60/60 — past 50 you're polishing forever

6. **Honesty check**
   - Are any stats made up? Reframe as personal observation ("7 out of 10 emails I get…" not "70% of marketers say…")
   - Is the personal moment real? Don't invent a story just to score higher.

### Output
- A draft scored ≥ 45/60
- Zero AI patterns
- At least one real personal moment
- One specific CTA question

### Quick reference: when to use which skill

| Skill | Use when |
|---|---|
| `/score` | You want a full audit of a draft (always start here) |
| `/human` | The draft sounds like ChatGPT wrote it (AI smell ≥ 4) |
| `/content-os/post-database/linkedin-rules/viral-memes/generate.py` | The post would land harder as a visual (hot takes, bell curve takes) |

---

## Workflow 7: Monthly Review & Memory Update

**When:** First Monday of each month
**Time:** 15 minutes
**Tools:** `idea-capture.md`, `winning-posts/`, `memory.md`

### Steps

1. **Review your published posts this month**
   - Which got the most engagement?
   - Which type (hot take, story, educational) performed best?
   - Which hooks worked?

2. **Update memory.md**
   - Update the Post Type Performance table
   - Add any new hook patterns to the Hook Patterns section
   - Update CTA patterns based on what drove comments vs shares
   - Update the Human writing rules if you learned something

3. **Review idea-capture.md**
   - Archive ideas older than 60 days that are no longer timely
   - Cluster recurring themes — "You keep coming back to [topic]. This could become a series."
   - Count how many ideas you captured vs published — what's the conversion rate?

4. **Review winning-posts/**
   - Any new creators to add? Pull their posts.
   - Any categories getting thin? Focus research there.
   - Update `sources.md` if you found new creators worth following

5. **Set next month's content priorities**
   - Which 2-3 topics to focus on?
   - Which post types to lean into?
   - Any timely events or launches to build content around?

### Output
- Memory.md updated with latest learnings
- Stale ideas archived
- Next month's priorities set

---

## Quick Reference

| Workflow | When | Time | Output |
|---|---|---|---|
| 1. Pull & Categorize | Weekly or new creator | 10 min | Winning posts updated |
| 2. Content Debrief | Every 3 days (automated Slack DM) | 5 min | 2-3 content seeds from your day |
| 2B. Draft Queue | Every 3 days | 2 min | One review-ready draft added to `draft-queue.md` |
| 3. Daily Capture | Every day | 5 min | 1-3 new ideas logged |
| 4. Weekly Scan | Monday | 20 min | 3-5 ideas + 2-3 picked for posts |
| 5. Idea → Post | When writing | 20-25 min | Scored, polished, published post |
| 6. Active Research | When stuck | 10 min | 3-5 emergency ideas |
| 7. Monthly Review | 1st Monday | 15 min | Memory updated, priorities set |
| 8. Audit & Polish | Existing draft | 5-10 min | Draft scored ≥ 45/60, AI smell killed |
