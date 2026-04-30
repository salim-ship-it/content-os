# Daily Debrief

5-minute interview that extracts stories, insights, and hot takes from your day. Produces 2-3 content seeds that accumulate over time. Run daily and you'll never run out of post ideas.

## When to Use

- "Daily debrief"
- "Content debrief"
- "What I learned today"
- "Capture today's content"
- "Extract content from my day"

---

## Workflow

### Step 1 — Pick the Question Set

Rotate between 3 sets to prevent fatigue:

**Set A — What happened (Mon/Thu):**
1. "What did you learn, ship, or notice today?"
2. "What surprised you or challenged something you believed?"
3. "What's something you'd tell a peer over coffee but wouldn't say on a stage?"

**Set B — Relationships & deals (Tue/Fri):**
1. "Who did you talk to today that made you think? What did they say?"
2. "Did you win or lose anything this week — a deal, an argument, a bet? What did it teach you?"
3. "What advice did you give someone today that you should take yourself?"

**Set C — Industry & opinions (Wed/Weekend):**
1. "What's a trend or take in your industry that you think is wrong? Why?"
2. "What tool, tactic, or process did you use today that most people in your space don't know about?"
3. "If you could send one message to everyone in your industry, what would it be?"

Ask ONE question at a time. Keep it conversational.

---

### Step 2 — Extract Content Seeds

From the answers, extract 2-3 seeds. Each is a potential LinkedIn post.

For each seed:

```
### Seed [N]: [Working title]

Core insight: [The idea in one sentence]
Angle: [contrarian / confession / proof / teach / hot-take / milestone / behind-the-scenes]
Hook suggestion: [A specific opening line]
Target audience: [Who would care — be specific]
Why it works: [Why this would resonate — 1 sentence]
Urgency: 🔴 Post within 48h (timely) / 🟡 This week / 🟢 Evergreen
Tags: #[topic] #[topic]
```

Extraction rules:
- Prioritize surprising or contrarian insights over generic observations
- If they mentioned a number or metric — lead with that
- If they expressed frustration or excitement — that's emotional fuel, use it
- Keep it raw — don't over-polish, voice doc handles tone later
- Each seed must be distinct in angle — not 3 versions of the same take
- At least one seed should come from the most uncomfortable or authentic answer

---

### Step 3 — Save Seeds

Append to `docs/content-seeds.md` with date header:

```markdown
---

## [YYYY-MM-DD]

Set: [A/B/C]

### Seed 1: [Title]
Core insight: ...
Angle: ...
Hook suggestion: ...
Target audience: ...
Why it works: ...
Urgency: ...
Tags: ...
```

Tell the user: "Saved [N] seeds. You now have [total] seeds banked. [N with 🔴 urgency] should be written this week."

---

### Step 4 — Auto-Review Trigger

**If 7+ seeds banked:** Surface top 3 to write first (ranked by: 🔴 urgency first, then contrarian/surprising angle, then emotional charge).

**If <7 seeds:** Offer: "Want me to turn any of these into a full post? Just say which seed number."

---

### Step 5 — Seed Review

Triggers when: "review my seeds", "prioritize my content", or 15+ seeds in the file.

1. Read all seeds
2. Prioritize top 5 — by urgency, contrarian angle, emotional charge
3. Cluster recurring themes — "You keep coming back to #[tag]. This could become a series."
4. Prune stale seeds — flag 🔴 seeds older than 7 days, archive timely seeds older than 60 days
5. After a seed becomes a published post, log result:

```
### Seed 3: [Title] ✓ PUBLISHED
Published: [date] | Impressions: [N] | Comments: [N]
What worked: [1 sentence]
```

---

## Rules

- ONE question at a time — never send all 3 at once
- Rotate question sets — same questions = same answers = stale seeds
- Don't over-polish seeds — they're raw material, not finished posts
- Push for uncomfortable answers — best content lives there
- Force variety in angles — if all 3 seeds are "teach", the batch is weak
- Timely seeds that sit for 2 weeks become mediocre evergreen posts — post fast

---

## Key File Paths

| File | Path |
|---|---|
| Content seeds | `docs/content-seeds.md` |
| Voice doc | `docs/voice.md` |
| Idea capture | `content-os/idea-engine/idea-capture.md` |
