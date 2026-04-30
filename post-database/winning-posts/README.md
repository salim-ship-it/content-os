# Winning Posts Database

Posts scraped from LinkedIn creators, categorized by type. A post is "winning" if it gets 100+ likes or 70+ comments.

## Categories

| File | Type | What goes here |
|---|---|---|
| [hot-takes.md](hot-takes.md) | Hot Takes / Contrarian | Bold opinions, unpopular takes, challenges to consensus |
| [stories.md](stories.md) | Story / Personal | Personal narratives, vulnerability, origin stories |
| [case-studies.md](case-studies.md) | Case Study / Teardown | Real examples broken down — emails, campaigns, strategies |
| [educational.md](educational.md) | Educational / Playbook | How-tos, frameworks, step-by-step breakdowns |
| [insightful.md](insightful.md) | Insightful / Leadership | Observations, leadership lessons, industry analysis |
| [transparency.md](transparency.md) | Transparency / Business Updates | Revenue numbers, metrics, honest business recaps |
| [announcements.md](announcements.md) | Company News / Announcements | Product launches, acquisitions, milestones |
| [engagement.md](engagement.md) | Engagement / Promo / Other | Teasers, interviews, giveaways, meta-posts |

## Post Format

Every post entry follows this format:

```
### [Hook — first line of the post]
- **Creator:** [name]
- **Date:** YYYY-MM-DD
- **Likes:** X | **Comments:** X | **Reposts:** X
- **Topic:** [what it was about]
- **Why it worked:** [1-2 sentences]
- **Link:** [LinkedIn URL]
```

## How to Add New Posts

When new posts are pulled from a creator via Apify:
1. Run the scraper → get JSON output
2. Categorize each post by type
3. Add to the matching .md file
4. Most recent posts at the top of each file
