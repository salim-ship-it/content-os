# Viral Memes Rules

What makes a meme post go viral on LinkedIn. This is a newer format on the platform — less saturated, high engagement when done right.

---

## Why Memes Work on LinkedIn

- Pattern interrupt — people expect polished professional content, a meme stops the scroll
- Low effort to consume, high effort to ignore — you either laugh or cringe
- Extremely shareable — saves and reposts are higher than any other format
- Shows personality — humanizes you in a sea of "thought leaders"

---

## Meme Formats That Work on LinkedIn

### Tier 1 — Proven formats

| Format | Description | When to use |
|---|---|---|
| **Relatable comparison** | Two-panel: "What people think I do" vs "What I actually do" | When your audience shares a common frustration |
| **Label meme** | Take a popular meme template, label the characters with industry terms | When there's a clear tension between two sides (sales vs marketing, SDRs vs AEs) |
| **Screenshot + caption** | Screenshot of something real (Slack message, email, dashboard) with a one-line caption | When you have a real moment that's funny or painfully relatable |
| **Before/after** | How it started vs how it's going | When showing a transformation or unexpected outcome |

### Tier 2 — Situational

| Format | Description | When to use |
|---|---|---|
| **Trending template** | Whatever meme is trending this week, adapted to your niche | Only when the template genuinely fits — forced memes die |
| **Text-only joke** | No image, just a punchy observation formatted as a joke | When the humor is strong enough to stand alone |
| **Poll meme** | Use LinkedIn's poll feature with funny/absurd options | When you want high engagement and don't care about depth |

---

## Rules for LinkedIn Memes

1. **It must be industry-specific.** Generic memes get ignored. "When the CEO says 'just one more thing'" hits because your audience has lived it.
2. **Keep text on image to minimum.** 5-10 words max on the image itself. Caption does the heavy lifting.
3. **Caption format:** One punchy line above the image. No paragraphs. No hashtags.
4. **Don't explain the joke.** If you have to explain it, it's not funny enough.
5. **Post timing:** Wednesday or Thursday, 8-9am. Midweek energy = people need a laugh.
6. **Frequency:** Max 1 meme per week. More than that = you become "the meme guy."
7. **Must be original or heavily adapted.** Don't just repost someone else's meme — add your spin.

---

## What Makes a LinkedIn Meme Viral

| Factor | Impact |
|---|---|
| **Relatability** | "This is so me" = save + share. The more specific, the more relatable. |
| **Tension** | Memes that touch on a real frustration or debate spread faster. |
| **Timing** | Memes about something happening right now (a product launch, an industry trend) get 3x the reach. |
| **Visual quality** | Doesn't need to be polished, but must be readable on mobile. |
| **Caption** | One line that sets up the meme without spoiling it. |

---

## Anti-Patterns

| Don't do this | Why |
|---|---|
| Corporate memes with stock photos | Feels like a marketing team made it. Cringe. |
| Memes making fun of customers | Alienates your audience. |
| Overused templates (months old) | Shows you're behind. |
| Meme + long educational caption | Pick one — be funny OR be educational. Not both. |
| AI-generated meme images | Usually uncanny valley. Use real templates. |

---

## Lessons Log

<!-- Add new lessons here every time we spot a viral meme pattern from creator posts -->

### From Charles Tenot's 50 posts (deep analysis 2026-04-01)

**Finding: Charles uses zero memes.** All 50 posts are text-only or text + single image. This tells us something important:

1. **You don't need memes to go viral on LinkedIn.** His text posts consistently hit 500-1300 likes. Pure text with strong hooks works.

2. **But this is also an opportunity.** His audience (SaaS, sales, GTM) responds strongly to humor and relatability. Posts like "Sales miss quota: fire them. Product miss deadline: adjust the roadmap" prove his audience loves wit. A meme version of this would likely outperform the text version on reshares.

3. **His most "meme-like" posts are his best performers.** The posts that feel closest to meme energy:
   - "6x7 is infinitely better than 8x5" — math meme energy, 406 likes
   - "Biggest red flags when hiring a CxO" — list meme format, 223 likes
   - "Sales miss quota: fire them" — comparison meme energy, 305 likes
   - These are essentially memes written as text. Visual meme versions could amplify them.

4. **Meme opportunities from his data:**
   - "What CEOs think SDRs do vs what SDRs actually do" (from his SDR posts)
   - "How sales teams feel when Product misses deadline" (from the double standard post)
   - "My PM after discovering Claude Code" (from the AI feature post)
   - Screenshot of a real cold email + "this is the one I replied to out of 1000" (from his #1 post)

**Action items:**
- Pull meme-heavy creators to build real meme rules (SDR meme accounts, sales humor pages)
- Test: take Charles' top hot take hooks and turn them into visual memes — compare performance
- The GTM/outbound meme space is under-served. Low competition = easy to stand out.

---

### Bell Curve / IQ Distribution Memes (added 2026-04-08)

The most reusable meme format for GTM/AI takes. Three characters along a bell curve:

- **Left (low IQ brainlet):** the naive position
- **Middle (crying soyjak with logos floating around him):** the overthinking position with all the tools
- **Right (hooded doomer):** the wise simple position

**The trick:** the LEFT and RIGHT often agree on the same answer, while the MIDDLE is the one drowning in complexity. This is what makes it funny — extremes converge.

**When it works:**
- When there's a clear "people overthinking it" angle in your topic
- When the simplest answer is actually the right one
- When you're calling out a tool/process trend that's gone too far

**Example we built (Vibe GTM post):**
- Left: "Doesn't use AI" (smiling brainlet)
- Middle: "Uses AI, no data" (crying soyjak surrounded by Claude, Clay, Apollo, Lemlist, Instantly, n8n, Make logos)
- Right: "Uses AI with context" (hooded doomer)

**Production:**
- Use `./generate.py` (in this folder) — calls Gemini 2.5 Flash Image (Nano Banana)
- Cost: ~$0.04 per image
- API key in `~/.vectorlabs/.env`
- Output saved to `./assets/` (in this folder)
- Iterate by passing the previous PNG as a reference image — the model will edit it instead of regenerating from scratch

**Iteration lessons (from building the Vibe GTM bell curve):**
1. First pass usually gets characters and layout right but text needs fixing.
2. Always specify exact label text — AI will paraphrase if you give it room.
3. Spelling mistakes happen ("Sass" instead of "SaaS"). Always proofread before posting.
4. Editing an existing image is faster than regenerating. Use the reference image flag.
5. Strip speech bubbles. Short labels under each character beat speech bubbles every time. Less to read = more shareable.

**Anti-pattern: meme + long preachy caption.** The whole point of a meme is that the image carries the joke. If you need 200 words to explain it, you needed a text post instead.
