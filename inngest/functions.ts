import { inngest } from "@/lib/inngest";
import { getSupabase } from "@/lib/supabase";
import { promises as fs } from "fs";
import path from "path";
import { buildDiagram, type DiagramSpec } from "@/lib/diagram-builder";

// Claude returns a DiagramSpec (structured JSON). The diagram-builder then
// produces the Excalidraw scene programmatically — guaranteeing text renders.

const SYSTEM_PROMPT = `You are a diagram architect. Given a brief, return a DiagramSpec JSON object via the create_diagram_spec tool.

Supported patterns:
- "fork"     — one start splits into two contrasting paths, then converges
- "pipeline" — linear sequence of steps left-to-right
- "timeline" — events along a time axis

Choose the pattern that best fits the brief.

Rules:
- Labels must be short (≤ 5 words). Use the exact words from the brief.
- sublabel is optional — one short phrase describing the output or meaning of a step.
- For fork: left = bad/wrong path (color "#f87171"), right = good/fix path (color "#4ade80").
- For pipeline: each step can have an optional color (default "#8182C1").
- Keep steps to 3–5 per column/pipeline. Do not invent steps not in the brief.
- All labels lowercase.`;

const TOOL = {
  name: "create_diagram_spec",
  description: "Return a structured DiagramSpec that the builder will convert to an Excalidraw scene.",
  input_schema: {
    type: "object" as const,
    properties: {
      spec: {
        type: "string",
        description: "The DiagramSpec as a JSON string. Must parse to a valid DiagramSpec object.",
      },
    },
    required: ["spec"],
  },
};

const REPO_ROOT = process.cwd();

async function getAnthropicKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf-8");
    for (const line of env.split("\n")) {
      if (line.startsWith("ANTHROPIC_API_KEY=")) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {}
  throw new Error("ANTHROPIC_API_KEY not found");
}

function canvasFromFormat(format: string): { width: number; height: number } {
  switch (format) {
    case "4:5":
      return { width: 1080, height: 1350 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
    default:
      return { width: 1080, height: 1080 };
  }
}

async function markJobError(jobId: string, message: string) {
  const supabase = await getSupabase();
  await supabase
    .from("image_jobs")
    .update({
      status: "error",
      error: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export const generateExcalidraw = inngest.createFunction(
  {
    id: "generate-excalidraw",
    retries: 1,
    triggers: [{ event: "image/excalidraw.requested" }],
    // On terminal failure (after retries), mark the job errored so the client
    // polling sees the failure instead of waiting forever.
    onFailure: async ({ event, error }) => {
      const original = (event as unknown as {
        data: { event: { data: { jobId: string } } };
      }).data?.event?.data;
      if (original?.jobId) {
        await markJobError(original.jobId, error?.message ?? "Unknown error");
      }
    },
  },
  async ({ event, step }) => {
    const { jobId, brief, format } = event.data;

    // Step 1: Claude → DiagramSpec → Excalidraw scene (built programmatically)
    const scene = await step.run("call-claude", async () => {
      const key = await getAnthropicKey();
      const canvas = canvasFromFormat(format);

      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          tools: [TOOL],
          tool_choice: { type: "tool", name: "create_diagram_spec" },
          messages: [{ role: "user", content: brief }],
        }),
      });

      if (!apiRes.ok) {
        const text = await apiRes.text();
        throw new Error(`Anthropic ${apiRes.status}: ${text.slice(0, 400)}`);
      }
      const data = await apiRes.json();
      const toolUse = (
        data.content as { type: string; name?: string; input?: unknown }[]
      )?.find(
        (c) => c.type === "tool_use" && c.name === "create_diagram_spec"
      ) as { input?: { spec?: string } } | undefined;

      if (!toolUse?.input?.spec) {
        throw new Error("Claude did not return a diagram spec.");
      }

      const spec = JSON.parse(toolUse.input.spec) as DiagramSpec;
      return buildDiagram(spec, canvas.width, canvas.height);
    });

    // Step 2: persist result to Supabase
    await step.run("save-result", async () => {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("image_jobs")
        .update({
          status: "complete",
          scene,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      if (error) throw new Error(`Supabase update failed: ${error.message}`);
    });

    return { ok: true, jobId };
  }
);

// Sweep content_posts every 5 minutes for any image_url still pointing to
// LinkedIn's signed CDN (which expires in ~3 weeks). Download the bytes,
// upload to Supabase Storage, and rewrite image_url to a permanent URL.
// Already-expired LinkedIn URLs are cleared so the UI stops trying to load them.
import { archivePendingPosts } from "@/lib/post-image-archive";

export const archivePostImages = inngest.createFunction(
  {
    id: "archive-post-images",
    retries: 0,
    triggers: [{ cron: "*/5 * * * *" }],
  },
  async ({ step }) => {
    const result = await step.run("archive-batch", async () => {
      return archivePendingPosts({ batchSize: 50 });
    });
    return result;
  }
);

// When a user adds a creator during onboarding, kick off an Apify scrape for
// that creator's last N posts. Posts get inserted into content_posts with the
// LinkedIn signed URL — the archiver cron then converts those URLs to
// permanent Supabase Storage URLs within 5 minutes.
async function getEnv(key: string): Promise<string> {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith(`${key}=`)) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch { /* ignore */ }
  throw new Error(`Missing env var: ${key}`);
}

const APIFY_ACTOR = "harvestapi~linkedin-profile-posts";

type ApifyPost = {
  entityId?: string;
  linkedinUrl?: string;
  content?: string;
  postedAt?: { date?: string; timestamp?: number };
  postImages?: Array<{ url?: string }>;
  engagement?: { likes?: number; comments?: number; shares?: number };
  author?: {
    name?: string;
    publicIdentifier?: string;
    avatar?: string | { url?: string };
    profilePictureUrl?: string;
    profileImageUrl?: string;
    pictureUrl?: string;
    picture?: string | { url?: string };
    image?: string | { url?: string };
    imageUrl?: string;
    photoUrl?: string;
    photo?: string | { url?: string };
    profilePicture?: string | { url?: string };
  };
};

function pickAuthorImage(p: ApifyPost): string {
  const a = p.author || {};
  const candidates: Array<unknown> = [
    a.avatar, a.profilePictureUrl, a.profileImageUrl, a.pictureUrl,
    a.picture, a.image, a.imageUrl, a.photoUrl, a.photo, a.profilePicture,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//.test(c)) return c;
    if (c && typeof c === "object") {
      const url = (c as { url?: string }).url;
      if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
    }
  }
  return "";
}

export const scrapeCreatorPosts = inngest.createFunction(
  {
    id: "scrape-creator-posts",
    retries: 2,
    triggers: [{ event: "creator/added" }],
  },
  async ({ event, step }) => {
    const { creatorUrl, creatorName, maxPosts } = event.data;

    // Step 1: kick off Apify run
    const runId = await step.run("start-apify", async () => {
      const token = await getEnv("APIFY_API_TOKEN");
      const res = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUrls: [creatorUrl],
            maxPosts,
            postedLimit: "any",
          }),
        }
      );
      if (!res.ok) throw new Error(`apify run start: HTTP ${res.status}`);
      const data = (await res.json()) as { data: { id: string; defaultDatasetId: string } };
      return { id: data.data.id, datasetId: data.data.defaultDatasetId };
    });

    // Step 2: poll until done (max ~10 min)
    const dataset = await step.run("wait-apify", async () => {
      const token = await getEnv("APIFY_API_TOKEN");
      const start = Date.now();
      const timeoutMs = 10 * 60 * 1000;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId.id}?token=${token}`
        );
        if (!res.ok) throw new Error(`apify status: HTTP ${res.status}`);
        const data = (await res.json()) as { data: { status: string } };
        const status = data.data.status;
        if (status === "SUCCEEDED") return runId.datasetId;
        if (["FAILED", "ABORTED", "TIMING-OUT", "TIMED-OUT"].includes(status)) {
          throw new Error(`apify run ${status}`);
        }
        if (Date.now() - start > timeoutMs) throw new Error("apify run timeout");
        await new Promise((r) => setTimeout(r, 8000));
      }
    });

    // Step 3: fetch dataset items
    const items = await step.run("fetch-dataset", async () => {
      const token = await getEnv("APIFY_API_TOKEN");
      const res = await fetch(
        `https://api.apify.com/v2/datasets/${dataset}/items?token=${token}`
      );
      if (!res.ok) throw new Error(`apify dataset: HTTP ${res.status}`);
      return (await res.json()) as ApifyPost[];
    });

    // Step 4: filter to this creator's own posts and insert any that aren't
    // already in the DB (de-duped by `link`). The `id` column is UUID-typed
    // and auto-generated, so we don't set it.
    const summary = await step.run("upsert-posts", async () => {
      const supabase = await getSupabase();
      const expectedSlug = creatorUrl.match(/\/in\/([^/?]+)/)?.[1] ?? "";

      // Pre-fetch existing links for this creator so we can skip duplicates.
      const { data: existingRows } = await supabase
        .from("content_posts")
        .select("link")
        .eq("creator", creatorName);
      const existingLinks = new Set(
        (existingRows ?? []).map((r) => (r as { link: string }).link)
      );

      let inserted = 0;
      let skipped = 0;

      for (const p of items) {
        const authorSlug = (p.author?.publicIdentifier || "").toLowerCase();
        if (authorSlug && expectedSlug.toLowerCase() !== authorSlug) {
          skipped++;
          continue;
        }
        const link = p.linkedinUrl || "";
        if (!link) {
          skipped++;
          continue;
        }
        if (existingLinks.has(link)) {
          skipped++;
          continue;
        }

        const dateRaw = p.postedAt?.date || "";
        const date = dateRaw ? dateRaw.slice(0, 10) : "";
        const imageUrl = p.postImages?.[0]?.url || "";
        const content = p.content || "";
        const title = content.split("\n")[0]?.slice(0, 200) || "";

        const row = {
          source: "linkedin",
          type: "engagement",
          title,
          creator: creatorName,
          date,
          likes: p.engagement?.likes ?? 0,
          comments: p.engagement?.comments ?? 0,
          reposts: p.engagement?.shares ?? 0,
          topic: "",
          why_it_worked: "",
          link,
          content,
          image_url: imageUrl,
          author_image_url: pickAuthorImage(p),
        };

        const { error } = await supabase.from("content_posts").insert(row);
        if (error) {
          console.error(`insert: ${error.message}`);
          skipped++;
        } else {
          inserted++;
        }
      }
      return { inserted, skipped, totalItems: items.length };
    });

    return { creator: creatorName, ...summary };
  }
);

// Reddit scrape — uses the free public Reddit JSON API (no auth, no key).
// Fired when /api/sources POST adds a `kind: "reddit"` row.
const REDDIT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const REDDIT_WINNER_COMMENTS = 50;
const REDDIT_WINNER_UPVOTES = 200;

type RedditPost = {
  title?: string;
  selftext?: string;
  permalink?: string;
  author?: string;
  score?: number;
  num_comments?: number;
  created_utc?: number;
  link_flair_text?: string;
};

function classifyRedditPost(p: RedditPost): string {
  const text = `${p.title || ""}\n${p.selftext || ""}`.toLowerCase();
  if (/\bhow to\b|\bguide\b|\btutorial\b|\bsteps\b|^\d+\s/.test(text)) return "educational";
  if (/\bmistake\b|\bwrong\b|\bbroken\b|\bnobody\b|\beveryone\b/.test(text)) return "hot take";
  if (/\bi (built|made|launched|started|got|spent)\b|\bmy story\b|\byears ago\b/.test(text)) return "story";
  if (/\bcase study\b|\bbreakdown\b|\bteardown\b|\baudit\b/.test(text)) return "case study";
  return "engagement";
}

export const scrapeRedditPosts = inngest.createFunction(
  {
    id: "scrape-reddit-posts",
    retries: 2,
    triggers: [{ event: "reddit/added" }],
  },
  async ({ event, step }) => {
    const { subredditName, time = "week", limit = 25 } = event.data as {
      subredditName: string;
      time?: "day" | "week" | "month" | "year" | "all";
      limit?: number;
    };
    const sub = (subredditName || "").replace(/^r\//i, "").trim();
    if (!sub) return { error: "no subreddit name" };

    const posts = await step.run("fetch-subreddit", async () => {
      const url = `https://www.reddit.com/r/${sub}/top.json?t=${time}&limit=${limit}`;
      const res = await fetch(url, { headers: { "User-Agent": REDDIT_USER_AGENT } });
      if (!res.ok) throw new Error(`reddit ${res.status}: ${res.statusText}`);
      const json = (await res.json()) as { data?: { children?: { data?: RedditPost }[] } };
      return (json?.data?.children || []).map((c) => c.data || {});
    });

    const summary = await step.run("upsert-posts", async () => {
      const supabase = await getSupabase();
      const creatorPrefix = `r/${sub}`;
      const { data: existingRows } = await supabase
        .from("content_posts")
        .select("link")
        .eq("source", "reddit")
        .ilike("creator", `${creatorPrefix}%`);
      const existingLinks = new Set(
        (existingRows ?? []).map((r) => (r as { link: string }).link)
      );

      let inserted = 0;
      let skipped = 0;

      for (const p of posts) {
        const winners =
          (p.num_comments || 0) >= REDDIT_WINNER_COMMENTS ||
          (p.score || 0) >= REDDIT_WINNER_UPVOTES;
        if (!winners) { skipped++; continue; }

        const link = p.permalink ? `https://www.reddit.com${p.permalink}` : "";
        if (!link) { skipped++; continue; }
        if (existingLinks.has(link)) { skipped++; continue; }

        const date = p.created_utc
          ? new Date(p.created_utc * 1000).toISOString().slice(0, 10)
          : "";
        const author = p.author ? `u/${p.author}` : "unknown";
        const content = `${p.title || ""}\n${p.selftext || ""}`.trim();
        const title = (p.title || "").slice(0, 500);

        const row = {
          source: "reddit",
          type: classifyRedditPost(p),
          title,
          creator: `${creatorPrefix} (${author})`,
          date,
          likes: p.score || 0,
          comments: p.num_comments || 0,
          reposts: 0,
          topic: p.link_flair_text || "",
          why_it_worked: "",
          link,
          content,
          image_url: "",
          author_image_url: "",
        };

        const { error } = await supabase.from("content_posts").insert(row);
        if (error) { console.error(`reddit insert: ${error.message}`); skipped++; }
        else inserted++;
      }
      return { inserted, skipped, total: posts.length };
    });

    return { subreddit: `r/${sub}`, ...summary };
  }
);
