# Content Repurposer

Take any post, article, or tweet — extract the core insight, find YOUR angle, and rewrite it in your voice. Not copying. Remixing with a point of view.

## When to Use

- "Repurpose this"
- "Rewrite this post"
- "Find my angle on this"
- "Make this mine"
- "Remix this"
- Share a URL or paste content and want to make it your own

---

## Workflow

### Step 1 — Load Voice Doc

Check for `docs/voice.md`:
- Exists → use voice modes, hooks, substitutions, platform rules
- Doesn't exist → ask 3 quick questions:
  1. "What's your tone — casual or polished?"
  2. "Who's your audience?"
  3. "Should the post feel like a story, a lesson, or a hot take?"

---

### Step 2 — Fetch the Source Content

- URL provided → fetch full text
- Content pasted → use directly
- Fetch fails → ask user to paste manually

---

### Step 3 — Deconstruct the Source (Show the User)

Always present this before rewriting:

```
Source Deconstruction:
- Core insight: [The one idea worth keeping — one sentence]
- Original angle: [How the author framed it]
- What made it work: [Why it got attention]
- What's generic: [Parts that are filler or could be said by anyone]
- Freshness: [Posted recently / N months ago — affects framing]
```

---

### Step 4 — Find Your Angle

Ask 2-3 questions:

1. "How does this relate to YOUR experience? What would you add or disagree with?"
2. "What's the consequence if this is wrong — or right? What happens next?"

If source is older than 30 days: "This is from N months ago. Has anything changed since then in your experience?"

If user says "just write it" — find a structural pattern from the voice doc that fits and frame it as their perspective based on tone.

---

### Step 5 — Choose Format

- **Text post** (default — single narrative, 150-300 words)
- **Carousel** (multi-slide breakdown)
- **Thread-style** (connected short posts)

Default to text post if user doesn't specify.

---

### Step 6 — Rewrite

Write a complete LinkedIn post that:

1. Keeps the core insight — underlying idea preserved
2. Changes the framing entirely — different hook, structure, angle
3. Adds your perspective — incorporates angle from Step 4
4. Follows voice rules — tone, hook patterns, word substitutions
5. Does NOT reference the original — no "I saw a post about..."
6. Matches the chosen format
7. If source is >30 days old — frame as evergreen insight, not breaking news

Output as plain text, ready to copy-paste.

---

### Step 7 — Show Your Work

After the post, briefly explain:

```
What I kept: [the core insight]
What I changed: [angle, structure, hook]
Voice applied: [which mode and patterns used]
Format: [text / carousel / thread]
```

---

### Step 8 — Handle Corrections

If feedback given:
- Fix immediately
- If correction reveals a voice rule → offer to update `docs/voice.md`

---

### Step 9 — Track Performance

When post is published, log in `docs/repurpose-log.md`:

```
## [YYYY-MM-DD] — [working title]
- Source: [original URL or topic]
- Angle used: [what was changed]
- Voice mode: [teaching / storytelling / provoking]
- Format: [text / carousel / thread]
- Performance: [impressions] impressions, [comments] comments
- Verdict: ★ Hit / ○ Average / ✗ Miss
```

After 5+ logged posts, surface patterns:
- Which angles perform best?
- Which formats get most engagement?
- Which hook patterns resonate?

---

## Rules

- Paraphrase = wrong. Reframe = right. The post should stand completely alone.
- Change the structure. If original was a list → try a story. If thesis → try a confession.
- Never write "I saw this post..." — the rewrite is its own thing.
- Show the deconstruction — it teaches you to think about content.
- Ask 2-3 rounds of "why does that matter?" to find the real angle.
- Never gate on missing voice doc — ask 3 questions and keep moving.

---

## Key File Paths

| File | Path |
|---|---|
| Voice doc | `docs/voice.md` |
| Repurpose log | `docs/repurpose-log.md` |
| Winning posts | `content-os/post-database/winning-posts.md` |
