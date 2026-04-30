# LinkedIn Rules

Playbooks built from analyzing real data — winning posts, top comments, viral formats. Every rule here comes from patterns we've seen in scraped creator posts.

Updated automatically when we pull and analyze new creator content.

## Files

| File | What it covers | How it's built |
|---|---|---|
| [general.md](general.md) | Posting rhythm, content mix, metrics, growth tactics | Baseline rules + updated from performance data |
| [commenting.md](commenting.md) | How to write comments that get impressions | Analyzing top comments on winning posts |
| [viral-posts.md](viral-posts.md) | What makes a text post go viral | Patterns from posts with 500+ likes |
| [viral-memes.md](viral-memes.md) | What makes a meme post go viral on LinkedIn | Patterns from high-engagement meme posts |
| [viral-carousels.md](viral-carousels.md) | What makes carousels and infographics perform | Patterns from high-save, high-share visual content |

## How These Get Updated

1. Pull creator posts via Apify (Workflow 1)
2. Categorize posts into `winning-posts/` by type
3. Analyze patterns — what hooks, formats, CTAs worked?
4. Extract lessons into the matching file here
5. Update `winning-posts/memory.md` with the feedback loop
