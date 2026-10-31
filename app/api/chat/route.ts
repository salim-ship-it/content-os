import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { REPO_ROOT, POST_FORMATS_PATH, CREATOR_STYLES_DIR } from "@/lib/paths";
import { claudeFetch } from "@/lib/claude-fetch";
import { loadContentWorkspace } from "@/lib/content-workspace";

const MODEL = "claude-haiku-4-5-20251001";

async function getApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envPath = path.join(REPO_ROOT, ".env.local");
    const env = await fs.readFile(envPath, "utf-8");
    for (const line of env.split("\n")) {
      if (line.startsWith("ANTHROPIC_API_KEY=")) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {}
  throw new Error("ANTHROPIC_API_KEY not found");
}

async function getPostFormats(): Promise<string> {
  try {
    return await fs.readFile(POST_FORMATS_PATH, "utf-8");
  } catch {
    return "(no post formats file)";
  }
}

async function getCreatorStyles(): Promise<string> {
  try {
    const files = await fs.readdir(CREATOR_STYLES_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    const contents = await Promise.all(
      mdFiles.map(async (f) => {
        const content = await fs.readFile(
          path.join(CREATOR_STYLES_DIR, f),
          "utf-8"
        );
        return content;
      })
    );
    return contents.join("\n\n---\n\n");
  } catch {
    return "(no creator styles found)";
  }
}

async function getTopPosts(source?: string, limit = 10): Promise<string> {
  const supabase = await getSupabase();
  let query = supabase
    .from("content_posts")
    .select("title,creator,likes,comments,type,content,link")
    .order("likes", { ascending: false })
    .limit(limit);

  if (source) query = query.eq("source", source);

  const { data } = await query;
  if (!data || data.length === 0) return "(no posts found)";

  return data
    .map(
      (p: Record<string, unknown>, i: number) =>
        `${i + 1}. [${p.likes} likes, ${p.comments} comments] ${p.creator}: "${p.title}"${p.content ? `\n   Content: ${String(p.content).slice(0, 500)}${String(p.content).length > 500 ? "..." : ""}` : ""}${p.link ? `\n   Link: ${p.link}` : ""}`
    )
    .join("\n\n");
}

async function buildSystemPrompt(userId: string): Promise<string> {
  const [workspace, postFormats, creatorStyles, topLinkedIn, topReddit, topLeadMagnets] =
    await Promise.all([
      loadContentWorkspace(userId),
      getPostFormats(),
      getCreatorStyles(),
      getTopPosts("linkedin", 15),
      getTopPosts("reddit", 10),
      getTopPosts("lead-magnet", 15),
    ]);

  const { identity } = workspace;
  const userDescription = `${identity.name}, ${identity.title}, based in ${identity.location}`;

  return `You are the Content OS AI assistant for ${userDescription}.

You help ${identity.name} document real RevOps and GTM work on LinkedIn: finding ideas, writing posts, editing drafts, iterating on hooks, and learning from published content.

## Identity
${identity.description}

Expertise: ${identity.expertise.join(", ")}

## Voice Profile
${workspace.voice}

## Audience
${workspace.audience}

## Content Pillars
${workspace.pillars}

## Verified Evidence Library
${workspace.evidence}

## Publishing Guardrails
${workspace.guardrails}

## Content Workflow
${workspace.workflow}

## Post Format Rules (follow these every time you write)
${postFormats}

## Creator Style Guides (deep analysis of 8 creators — use these when imitating)
${creatorStyles}

## Top LinkedIn Posts in the Database (for reference and imitation)
${topLinkedIn}

## Top Reddit Threads (for content angles)
${topReddit}

## Top Lead Magnet Posts (Swipe file — these are posts with free resources)
${topLeadMagnets}

## HOOK RULE — critical
When the user picks a creator, use the creator's documented structural patterns as inspiration. Never copy recognizable wording or impersonate the creator. A hook may be original when that better fits Salim's evidence and voice.

## YOUR CAPABILITIES
1. Suggest ideas — pick from the database, combine angles, find gaps
2. Write posts — in Salim's voice, optionally borrowing a creator's structural mechanism
3. Score posts — only when explicitly asked. Use the 6-dimension rubric below.
4. Iterate — take feedback and rewrite specific parts
5. Change hooks — generate materially different variations and explain their direction when useful
6. Create lead magnets — see guidelines below

## Scoring rubric (only when asked to score)
- AI Smell (0-10, lower=better): Symmetrical pairs, "it's not X it's Y", rhetorical questions, em dashes, filler phrases, parallel bullets all the same length, dot-fragments on the same line
- Hook (0-10): First line under 10 words? Specific? Creates tension? No warmup?
- CTA (0-10): Specific question? Drives comments? Easy to answer?
- Format (0-10): White space? Single-sentence paragraphs? Under 1300 chars?
- Structure (0-10): One idea? Hook → evidence → landing? No buried lede?
- Storytelling (0-10): Personal moment? Real numbers? Specific detail?

## Hard rules — never break these
- Never use em dashes (—) anywhere in a post
- Never write symmetrical sentence pairs ("We stopped X. Started Y.")
- Never write dot-fragments on the same line: "Tokens. Sequences. Breakup email." — use a proper ladder instead
- Never use: "leverage", "optimize", "unlock", "streamline", "dive into", "game-changer", "delve", "cutting-edge", "robust", "ensure", "utilize"
- Never wrap a post with a closing moral that neatly summarizes everything
- Never auto-score after writing. Only score when the user asks.
- When suggesting ideas, use database references only when they genuinely support the recommendation.
- Never invent a result or expose information prohibited by the publishing guardrails.
- Be direct. No fluff. No "great question!" or "happy to help" openers.
- When scoring, quote the exact lines you're flagging and give before/after rewrites.

## Lead magnet creation guidelines
When creating a lead magnet post:
1. Analyze the top lead magnet posts above — identify the winning hook style, value stack format, and CTA trigger
2. The best lead magnets follow this structure: Bold claim hook → What's inside (value stack with → arrows or bullet points) → Social proof line → Simple CTA ("Comment [WORD]")
3. The trigger word should be 1 word, ALL CAPS, related to the resource (PLAYBOOK, VAULT, SYSTEM, BLUEPRINT, etc.)
4. Never use generic "DM me for more info" — always specify EXACTLY what they get
5. Reference the user's actual expertise: GTM engineering, Clay, outbound automation, Claude Code, content systems
6. Keep the post under 1500 characters for optimal LinkedIn reach`;
}

export async function POST(request: Request) {
  const userId = await requireUser();
  const body = await request.json();
  const messages = body.messages || [];

  if (!messages.length) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const apiKey = await getApiKey();
  const systemPrompt = await buildSystemPrompt(userId);

  const response = await claudeFetch(apiKey, {
    model: MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages,
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `Claude API ${response.status}: ${text.slice(0, 300)}` },
      { status: 500 }
    );
  }

  const data = await response.json();
  const reply = data?.content?.[0]?.text || "";

  return NextResponse.json({ reply });
}
