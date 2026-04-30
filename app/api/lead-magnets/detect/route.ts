import { type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { claudeFetch } from "@/lib/claude-fetch";

// Batch lead-magnet detection endpoint hit by the Chrome extension.
// Pipeline: regex prefilter -> Supabase cache lookup -> batched Claude Haiku -> save.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Trigger patterns that usually accompany a lead magnet. If none match, skip Claude.
// Kept intentionally broad — we'd rather pay for one extra Claude call than miss a magnet.
const RESOURCE_WORDS = "guide|playbook|template|checklist|ebook|e-?book|pdf|course|swipe|framework|kit|doc|notion|toolkit|system|workbook|cheatsheet|cheat sheet|blueprint|sop|prompt|prompts";
const LINK_HOSTS = "gumroad|notion\\.so|typeform|substack|beehiiv|mailchimp|convertkit|carrd|tally\\.so|airtable|google docs|docs\\.google|drive\\.google|lu\\.ma|calendly";

const TRIGGER_PATTERNS: RegExp[] = [
  // Comment-to-get patterns
  /\b(comment|drop|type|write)\b[^.\n]{0,60}\b(below|to get|and i'?ll|to receive|for (the|a|my|this))/i,
  /\bcomment\s+["'“][\w ]{1,20}["'”]/i,
  /\b(first|next)\s+\d+\s+(comments?|people|folks)/i,

  // DM patterns
  /\b(dm|pm|message)\s+(me|us|the word)\b/i,
  /\bi'?ll\s+(dm|send|share)\s+(it|you|them|the)\b/i,
  /\b(dm|pm)\s+["'“][\w ]{1,20}["'”]/i,

  // Link / comments pointers
  /\blink\s+(in (the )?(comments?|bio|first comment)|below|↓|👇)/i,
  /(👇|↓)\s*(link|check|get|grab|download|doc|notion|guide|playbook)/i,
  /\bcheck (the )?(comments?|first comment|link|bio)\b/i,

  // Resource words
  new RegExp(`\\bfree\\s+(${RESOURCE_WORDS})\\b`, "i"),
  new RegExp(`\\b(grab|steal|save|get|download|want)\\s+(the|my|your|this|a|our)\\s+(${RESOURCE_WORDS})\\b`, "i"),
  new RegExp(`\\b(${RESOURCE_WORDS})\\s+(is|are)\\s+(free|yours|below|ready)\\b`, "i"),
  new RegExp(`\\b(built|created|made|put together|compiled)\\s+(a|an|my|the)\\s+(${RESOURCE_WORDS})\\b`, "i"),
  new RegExp(`\\b(100\\s*\\+?|\\d{2,4}\\+?)\\s+(${RESOURCE_WORDS})\\b`, "i"),

  // External host drop-ins (gumroad/notion/typeform/etc. typically = lead magnet)
  new RegExp(`\\b(${LINK_HOSTS})\\b`, "i"),

  // Other common phrasings
  /\breply with (the )?word\b/i,
  /\b(subscribe|sign up|join (the )?(waitlist|list|newsletter))\b/i,
  /\btag\s+(a|someone|your)\b/i,
  /\b(giveaway|giving away|giving it away)\b/i,
  /\blike (and|\+) (comment|share|dm)\b/i,
  /\b(share|repost) (this|to)\b/i,
];

type IncomingPost = {
  urn: string;
  author: string;
  authorUrl?: string;
  text: string;
  links?: string[];
  postUrl: string;
};

type ClassifyResult = {
  is_lead_magnet: boolean;
  type: string;
  title: string | null;
  cta_mechanism: string;
  cta_trigger: string;
  link: string | null;
  confidence: number;
};

function hasTrigger(text: string): boolean {
  return TRIGGER_PATTERNS.some((re) => re.test(text));
}

function jsonCORS(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function classifyBatch(posts: IncomingPost[]): Promise<ClassifyResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const numbered = posts
    .map(
      (p, i) =>
        `--- POST ${i + 1} ---\nAuthor: ${p.author}\nLinks: ${(p.links || []).join(", ") || "none"}\nText:\n"""${p.text.slice(0, 1500)}"""`,
    )
    .join("\n\n");

  const prompt = `You are detecting lead magnets in LinkedIn posts. A lead magnet is a free resource (guide, template, checklist, playbook, swipe file, PDF, ebook, course, tool) offered in exchange for a comment, DM, email, or click.

Classify EACH of the ${posts.length} posts below. Respond with a single JSON array of ${posts.length} objects, in the same order as the posts. No commentary, JSON only.

Each object:
{
  "is_lead_magnet": true | false,
  "type": "guide|template|checklist|playbook|swipe_file|pdf|ebook|course|tool|other|none",
  "title": "short name of the asset or null",
  "cta_mechanism": "comment|dm|link|email|none",
  "cta_trigger": "the word/phrase to comment or DM, if any",
  "link": "the lead magnet link if clearly in post, else null",
  "confidence": 0.0-1.0
}

${numbered}`;

  const res = await claudeFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { content: { text: string }[] };
  const text = data.content[0].text.trim();
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (!arrMatch) throw new Error("no JSON array in Claude response");
  const parsed = JSON.parse(arrMatch[0]) as ClassifyResult[];
  if (!Array.isArray(parsed) || parsed.length !== posts.length) {
    throw new Error(`classification length mismatch: got ${parsed?.length} expected ${posts.length}`);
  }
  return parsed;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const posts: IncomingPost[] = Array.isArray(body?.posts) ? body.posts : [];
  if (posts.length === 0) return jsonCORS({ error: "posts array required" }, 400);
  if (posts.length > 20) return jsonCORS({ error: "max 20 posts per batch" }, 400);

  const supabase = await getSupabase();

  // Stage 1: regex prefilter
  const afterRegex = posts.filter((p) => p.text && hasTrigger(p.text));
  const skippedRegex = posts.length - afterRegex.length;
  if (afterRegex.length === 0) {
    return jsonCORS({ saved: 0, classified: 0, cacheHits: 0, skippedRegex, skippedCache: 0 });
  }

  // Stage 2: cache lookup by link in content_posts (source='lead-magnet')
  const urls = afterRegex.map((p) => p.postUrl);
  const { data: cached } = await supabase
    .from("content_posts")
    .select("link")
    .eq("source", "lead-magnet")
    .in("link", urls);
  const cachedSet = new Set(((cached || []) as { link: string }[]).map((r) => r.link));
  const needsClassify = afterRegex.filter((p) => !cachedSet.has(p.postUrl));
  const cacheHits = afterRegex.length - needsClassify.length;

  if (needsClassify.length === 0) {
    return jsonCORS({ saved: 0, classified: 0, cacheHits, skippedRegex, skippedCache: 0 });
  }

  // Stage 3: batched Claude classification
  let verdicts: ClassifyResult[];
  try {
    verdicts = await classifyBatch(needsClassify);
  } catch (e) {
    return jsonCORS({ error: e instanceof Error ? e.message : "classify failed" }, 500);
  }

  // Stage 4: save winners (confidence >= 0.6) to content_posts
  const saved: { link: string; type: string; title: string | null }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < needsClassify.length; i++) {
    const post = needsClassify[i];
    const v = verdicts[i];
    if (!v?.is_lead_magnet || (v.confidence ?? 0) < 0.6) continue;

    const row = {
      source: "lead-magnet",
      type: v.type || "other",
      title: (v.title || post.text.split("\n")[0] || post.postUrl).slice(0, 500),
      creator: post.author || "unknown",
      date: today,
      likes: 0,
      comments: 0,
      reposts: 0,
      topic: v.cta_trigger || "",
      why_it_worked: v.cta_mechanism || "",
      link: post.postUrl,
      content: post.text,
      image_url: null as string | null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("content_posts").insert(row);
    if (!error) saved.push({ link: post.postUrl, type: row.type, title: row.title });
  }

  return jsonCORS({
    saved: saved.length,
    classified: needsClassify.length,
    cacheHits,
    skippedRegex,
    skippedCache: 0,
    results: saved,
  });
}
