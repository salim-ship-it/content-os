import { promises as fs } from "fs";
import path from "path";
import { CREATOR_INSIGHTS_DIR } from "./paths";
import type { WinningPost } from "./winning-posts";
import { analyzeCreator } from "./creator-analysis";
import { claudeFetch } from "./claude-fetch";

const MODEL = "claude-haiku-4-5";

export type CreatorInsightsCache = {
  creator: string;
  slug: string;
  generatedAt: string;
  model: string;
  postCount: number;
  markdown: string;
};

async function getAnthropicKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // Fall back to .env.local at repo root (same pattern as lib/supabase.ts)
  try {
    const envPath = path.resolve(process.cwd(), "../../../../.env.local");
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("ANTHROPIC_API_KEY=")) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch { /* ignore */ }
  throw new Error("Missing ANTHROPIC_API_KEY");
}

function cachePath(slug: string): string {
  return path.join(CREATOR_INSIGHTS_DIR, `${slug}.json`);
}

export async function readInsightsCache(slug: string): Promise<CreatorInsightsCache | null> {
  try {
    const raw = await fs.readFile(cachePath(slug), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeInsightsCache(cache: CreatorInsightsCache): Promise<void> {
  await fs.mkdir(CREATOR_INSIGHTS_DIR, { recursive: true });
  await fs.writeFile(cachePath(cache.slug), JSON.stringify(cache, null, 2) + "\n");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n) + "…";
}

function buildPrompt(creator: string, posts: WinningPost[]): string {
  const stats = analyzeCreator(posts);
  const topPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 20);

  const hookTable = stats.hooks
    .map((h) => `| ${h.label} | ${h.count} | ${h.avgLikes} | ${h.avgComments} |`)
    .join("\n");
  const formatLengths = stats.formats.lengths
    .map((l) => `- ${l.label}: ${l.count} posts · avg ${l.avgLikes} likes`)
    .join("\n");
  const ctaTable = stats.ctas
    .map((c) => `| ${c.label} | ${c.count} | ${c.avgLikes} |`)
    .join("\n");
  const keywords = stats.keywords
    .slice(0, 15)
    .map((k) => `${k.keyword} (${k.count} posts, avg ${k.avgLikes} likes)`)
    .join(", ");

  const postList = topPosts
    .map(
      (p, i) =>
        `### Post ${i + 1} · ${p.likes} likes · ${p.comments} comments · ${p.date}\n${truncate(p.content, 800)}`,
    )
    .join("\n\n");

  return `You are analyzing a LinkedIn creator's content strategy for another creator who wants to study and learn from them.

Creator: **${creator}**
Posts analyzed: ${posts.length} (${stats.dateRange.from} → ${stats.dateRange.to})
Average likes: ${stats.avgLikes}
Average comments: ${stats.avgComments}

# Pre-computed analysis

## Hook patterns (opening-line bucket · count · avg likes · avg comments)
${hookTable}

## Formats
${formatLengths}
- With image: ${stats.formats.withImage.count} · avg ${stats.formats.withImage.avgLikes} likes
- Text only: ${stats.formats.textOnly.count} · avg ${stats.formats.textOnly.avgLikes} likes

## CTAs (closing pattern · count · avg likes)
${ctaTable}

## Top keywords
${keywords}

# Top 20 posts by likes

${postList}

# Your task

Write a strategic insights briefing. Structure it with these exact markdown headings:

## Their core patterns
3–5 bullet points. What makes their content work. Cite specific hooks or phrases from actual posts above.

## Writing style signature
How their writing sounds — tone, sentence rhythm, vocabulary, structure. Be specific.

## What to copy
Specific patterns you can replicate. Bullet points.

## What to avoid
Where they're weak or overusing a pattern. Honest, not generic.

## Strategic recommendations
If a creator wanted to write like them or compete with them, what would you do? Concrete actions.

Rules:
- Reference actual first lines from their posts as examples.
- Never use generic advice like "be authentic" or "share your story."
- Sharp, specific, operator-tone. No hedging.
- Total length: ~600-900 words.`;
}

export async function generateInsights(
  creator: string,
  slug: string,
  posts: WinningPost[],
): Promise<CreatorInsightsCache> {
  const apiKey = await getAnthropicKey();
  const prompt = buildPrompt(creator, posts);

  const response = await claudeFetch(apiKey, {
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API failed: ${response.status} ${text.slice(0, 400)}`);
  }

  const data = await response.json();
  const markdown =
    (Array.isArray(data.content) && data.content[0]?.text) ||
    data.content?.text ||
    "";

  if (!markdown) {
    throw new Error("Anthropic returned empty response");
  }

  const cache: CreatorInsightsCache = {
    creator,
    slug,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    postCount: posts.length,
    markdown,
  };
  await writeInsightsCache(cache);
  return cache;
}
