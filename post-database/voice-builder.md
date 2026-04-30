# Voice Builder

Analyze your best writing + run a voice discovery interview. Produces a structured voice document that other skills reference when writing for you.

## When to Use

- "Build my LinkedIn voice"
- "Define my writing style"
- "Create my voice doc"
- "How should I write on LinkedIn"
- Posts sound generic or inconsistent

---

## Workflow

### Step 1 — Check for Existing Voice Doc

Look for `docs/voice.md`:
- Exists → read it and ask: "Want to refine it, or start fresh?"
- Doesn't exist → proceed to Step 2

---

### Step 2 — Collect Writing Samples

Ask: "Share 3-5 LinkedIn posts you've written. Include at least one that got unexpectedly good engagement."

If fewer than 3 posts: "No worries — paste whatever you have, even draft messages or emails that feel like 'you'."

---

### Step 3 — Analyze Patterns (Silent)

Analyze samples across:
- Sentence length — average, range, rhythm
- Vocabulary — simple/complex ratio, jargon level, signature words
- Hook patterns — how do they open? (question, statement, number, story, contrarian)
- Structure — how do they organize? (thesis-proof, story-lesson, list, problem-solution)
- Tone spectrum — casual-formal, concrete-abstract, personal-analytical
- Closing style — conviction, question, callback, mic drop
- Formatting — line breaks, spacing, emojis or not

---

### Step 4 — Voice Discovery Interview

Ask these 5 questions ONE AT A TIME:

1. "Paste the post that got you the most engagement. Why do you think it hit?"
2. "Who are you writing FOR? What do they believe, and what would make them stop scrolling?"
3. "Which writers or creators influence your style? What do you admire about their writing?"
4. "What words or phrases do you NEVER want to use — and what would you say instead?"
5. "When someone reads your post, what should it FEEL like? (A conversation? A confession? A manifesto?)"

---

### Step 5 — Build the Voice Doc

Synthesize analysis + interview into this format:

```markdown
# LinkedIn Voice — [Name]

## Identity
- Audience: [who they're writing for]
- What the audience believes: [their worldview]
- Scroll-stopper: [what makes this audience pause]
- Influences: [writers/creators they named]

## Voice Modes

### Teaching Mode
- When to use: sharing a framework, process, or lesson
- Tone: [from samples]
- Pattern: [structure from samples]

### Storytelling Mode
- When to use: personal experience, case study, behind-the-scenes
- Tone: [from samples]
- Pattern: [structure from samples]

### Provoking Mode
- When to use: contrarian take, hot take, challenging conventional wisdom
- Tone: [from samples]
- Pattern: [structure from samples]

## Tone Spectrum
| Dimension | Position |
|---|---|
| Casual - Formal | [X]% casual |
| Concrete - Abstract | [X]% concrete |
| Personal - Analytical | [X]% personal |

## Hook Patterns
1. [Pattern name] — [description + example]
2. [Pattern name] — [description + example]
3. [Pattern name] — [description + example]

## Word Substitutions
| Never say | Say instead |
|---|---|
| [banned word] | [preferred alternative] |

## Platform Rules (LinkedIn)
- Hook must land in 2 lines — that's all the preview shows
- Short paragraphs (1-3 sentences max)
- No bold text in posts (renders poorly on mobile)
- Word count sweet spot: ~[avg from samples] words
```

Ask: "Does this capture your voice? Anything feel off?"

---

### Step 6 — Save

After approval, save to `docs/voice.md`.

---

### Step 7 — Consistency Check

Triggers when user says "check my voice", "am I drifting", or after 5+ new posts.

1. Read `docs/voice.md`
2. Ask: "Paste your last 3-5 LinkedIn posts"
3. Score each post as % match against voice doc
4. Present report:

```
Voice Consistency Report
- Post 1: X% match — [1-line note]
- Post 2: X% match — [1-line note]
- Post 3: X% match — [1-line note]

Patterns: [what's consistent]
Drift: [what's changed]
Recommendation: [update voice doc or course-correct?]
```

---

## Rules

- Extract the voice, don't project one — the doc should match what they already write
- Always capture all 3 voice modes — people write differently per context
- Never block on missing samples — work with what you have
- Keep the doc concise — a voice doc nobody re-reads is useless
- Run consistency check monthly

---

## Key File Paths

| File | Path |
|---|---|
| Voice doc | `docs/voice.md` |
| Repurpose log | `docs/repurpose-log.md` |
| Winning posts | `content-os/post-database/winning-posts.md` |
