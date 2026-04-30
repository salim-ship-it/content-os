#!/usr/bin/env node

/**
 * relevance-filter.mjs — AI relevance filter using Claude Haiku
 *
 * Takes a batch of posts and asks Claude whether each one is relevant
 * to a GTM engineer building outbound for B2B SaaS.
 *
 * Returns a parallel array of { relevant: boolean, reason: string }.
 *
 * Cost: ~$0.001 per post (Haiku is cheap).
 * Batched: 10 posts per API call to minimize overhead.
 */

const MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 10;
const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are filtering content for Salim, a GTM engineer and agency CEO who writes LinkedIn content. He builds outbound systems for B2B SaaS founders using Clay, Apify, Lemlist, Instantly, and Claude Code.

His content covers TWO areas:
1. GTM engineering, outbound, AI in sales — his professional expertise
2. Personal stories, founder life, origin moments, behind-the-scenes — his personal brand

Your job: decide if each post is RELEVANT to his content universe. Be generous on personal stories — they often perform the best.

RELEVANT topics:
- GTM strategy, outbound, cold email, sales automation
- SaaS founder pain points, growth, churn, pricing, sales hiring
- AI in sales/marketing/RevOps (Clay, Apollo, Lemlist, agents, etc.)
- Claude Code / agent workflows for business use cases
- B2B marketing, content strategy, LinkedIn growth
- Real client / campaign results with numbers
- Tools comparisons relevant to GTM stack
- Personal stories from founders or operators (origin stories, pivots, failures, wins)
- Behind-the-scenes of building a business (agency, SaaS, solo founder)
- Career decisions, hiring stories, firing stories, first customer stories
- Hot takes about work culture, remote work, leadership — if relevant to SaaS/startup world
- Contrarian opinions about sales, marketing, or AI
- Anything a SaaS founder doing $1M-$10M ARR would stop scrolling to read

NOT RELEVANT:
- Pure AI memes / fan content / inside jokes (e.g. "Claude said something funny", "Anthropic press release jokes", meme posts with no insight)
- Relationship drama with no business angle
- Generic motivation / self-help / life coaching with no founder context
- Crypto / investing / personal finance
- Random hobby projects completely unrelated to business or tech
- Job interview how-tos / resume tips (unless about hiring as a founder)

Return ONLY a JSON array, one object per post in input order:
[{"i": 0, "r": true, "why": "brief reason"}, {"i": 1, "r": false, "why": "brief reason"}, ...]

When in doubt, lean YES. Missing a great personal story is worse than keeping a mediocre one.`;

function buildUserPrompt(posts) {
  const lines = posts.map(
    (p, i) =>
      `${i}. [${p.source || 'unknown'} · ${p.creator || 'unknown'}] ${p.title}${p.topic ? ` — ${p.topic}` : ''}`,
  );
  return `Classify these ${posts.length} posts:\n\n${lines.join('\n')}\n\nReturn only the JSON array.`;
}

async function callClaude(posts, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(posts),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || '';

  // Extract JSON array from the response (Claude might wrap it in markdown)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array in response: ${text.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}

/**
 * Filter posts for relevance.
 *
 * @param {Array<{title: string, source?: string, creator?: string, topic?: string}>} posts
 * @returns {Promise<Array<{relevant: boolean, reason: string}>>}
 */
export async function filterByRelevance(posts) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set in environment');
  }

  if (posts.length === 0) return [];

  const results = new Array(posts.length).fill(null);

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    try {
      const verdicts = await callClaude(batch, apiKey);
      for (const v of verdicts) {
        const localIdx = Number(v.i);
        if (Number.isInteger(localIdx) && localIdx >= 0 && localIdx < batch.length) {
          results[i + localIdx] = {
            relevant: Boolean(v.r),
            reason: String(v.why || ''),
          };
        }
      }
      // Fill any missing slots in this batch as relevant (fail open — don't drop on parse error)
      for (let j = 0; j < batch.length; j += 1) {
        if (results[i + j] === null) {
          results[i + j] = { relevant: true, reason: 'parse error — kept by default' };
        }
      }
    } catch (error) {
      // On API error, mark the whole batch as relevant (fail open)
      console.error(`  ⚠️  Filter batch ${i / BATCH_SIZE + 1} failed: ${error.message}`);
      for (let j = 0; j < batch.length; j += 1) {
        results[i + j] = { relevant: true, reason: `filter error: ${error.message}` };
      }
    }

    // Small pause between batches to be polite to the API
    if (i + BATCH_SIZE < posts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
