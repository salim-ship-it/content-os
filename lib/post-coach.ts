import { promises as fs } from "fs";
import path from "path";
import { POST_COACH_DIR } from "./paths";
import { getSupabase } from "./supabase";
import { claudeFetch } from "./claude-fetch";

const MODEL = "claude-haiku-4-5";
const CACHE_FILE = path.join(POST_COACH_DIR, "latest.json");

export type PostCoachCache = {
  generatedAt: string;
  model: string;
  myPostCount: number;
  creatorPostCount: number;
  markdown: string;
};

type PublishedPost = {
  title: string;
  content: string | null;
  published_date: string;
  post_type: string | null;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  new_followers: number;
  impressions: number;
  notes: string | null;
};

type CreatorPost = {
  title: string;
  content: string;
  creator: string;
  likes: number;
  comments: number;
};

async function getAnthropicKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
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

export async function readCoachCache(): Promise<PostCoachCache | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCoachCache(cache: PostCoachCache): Promise<void> {
  await fs.mkdir(POST_COACH_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n");
}

async function fetchPublishedPosts(): Promise<PublishedPost[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("published_posts")
    .select("title, content, published_date, post_type, likes, comments, reposts, saves, new_followers, impressions, notes")
    .order("published_date", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []) as PublishedPost[];
}

async function fetchTopCreatorPosts(): Promise<CreatorPost[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("content_posts")
    .select("title, content, creator, likes, comments")
    .eq("source", "linkedin")
    .order("likes", { ascending: false })
    .limit(30);

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []) as CreatorPost[];
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n) + "...";
}

function buildPrompt(myPosts: PublishedPost[], creatorPosts: CreatorPost[]): string {
  // Focus on the 5 most recent posts for detailed surgery
  const recent = myPosts.slice(0, 5);
  const recentSection = recent.map((p, i) =>
    `POST ${i + 1}: "${truncate(p.title, 200)}"
Type: ${p.post_type || "unknown"} | Date: ${p.published_date}
Likes: ${p.likes} | Comments: ${p.comments} | Reposts: ${p.reposts}
Full content:
"""
${p.content || "(no content logged)"}
"""`
  ).join("\n\n---\n\n");

  // Older posts for pattern context
  const olderSection = myPosts.slice(5).map((p) =>
    `- "${truncate(p.title, 100)}" | ${p.post_type} | ${p.likes} likes, ${p.comments} comments`
  ).join("\n");

  // Top creator posts as reference
  const creatorSection = creatorPosts.slice(0, 10).map((p) =>
    `[${p.likes} likes] ${p.creator}: "${truncate(p.title, 120)}"
${truncate(p.content, 500)}`
  ).join("\n\n---\n\n");

  return `You are a LinkedIn content coach. Your job is to look at Salim's actual posts and tell him exactly what to change -- line by line, word by word. Not trends. Not patterns. Specific rewrites and fixes he can apply today.

## Salim's 5 Most Recent Posts (full text)

${recentSection}

## Older Posts (for context, ${myPosts.length - recent.length} more)

${olderSection}

## Top Creator Posts (what good looks like)

${creatorSection}

## Your Task

For each of the 5 recent posts above, give a short verdict:

### Post 1: "[first few words of hook]..."

**Hook verdict:** Is the hook strong or weak? If weak, rewrite it. Give the exact new hook. Example: "Your hook is 14 words. Rewrite: 'I rebuilt a $60K tool for $100/month.' -- 8 words, specific number, curiosity."

**Structure verdict:** Is the post scannable? Too dense? Wrong format for the topic? Tell him what to cut or restructure. Be specific -- "delete paragraph 3, it repeats paragraph 1" or "break the wall of text after line 4."

**Ending verdict:** Does it end with something that makes people comment? If not, give the exact closing line or question to add.

**One-line fix:** The single most impactful change that would have doubled this post's engagement.

(Repeat for all 5 posts)

### What to post next

Based on what performed best and what the top creators are getting engagement on right now, give Salim 2 specific post ideas:
- The exact hook (written out, not described)
- The format (list, story, hot take, breakdown)
- Why this will work (reference a specific creator post or his own best-performing post)

Rules:
- Write actual rewrites, not descriptions of rewrites. "Make it shorter" is useless. "Rewrite: 'I spent 6 months at Yousign. Here's what broke.'" is useful.
- Reference the actual text from the posts above. Quote lines you'd cut or change.
- No generic LinkedIn advice. No "engage with your audience." No "be more vulnerable."
- Short sentences. Direct. No filler.
- Total length: 600-1000 words.`;
}

export async function generateCoachAnalysis(): Promise<PostCoachCache> {
  const [myPosts, creatorPosts] = await Promise.all([
    fetchPublishedPosts(),
    fetchTopCreatorPosts(),
  ]);

  if (myPosts.length === 0) {
    throw new Error("No published posts found. Log some posts on the Analytics page first.");
  }

  const prompt = buildPrompt(myPosts, creatorPosts);
  const apiKey = await getAnthropicKey();

  const response = await claudeFetch(apiKey, {
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${text.slice(0, 300)}`);
  }

  const result = await response.json();
  const markdown = result.content?.[0]?.text || "";

  const cache: PostCoachCache = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    myPostCount: myPosts.length,
    creatorPostCount: creatorPosts.length,
    markdown,
  };

  await writeCoachCache(cache);
  return cache;
}
