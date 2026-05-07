import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { REPO_ROOT, VOICE_PROFILE_PATH } from "@/lib/paths";
import { claudeFetch } from "@/lib/claude-fetch";

const MODEL = "claude-haiku-4-5";

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

async function getVoiceProfile(): Promise<string> {
  try {
    return await fs.readFile(VOICE_PROFILE_PATH, "utf-8");
  } catch {
    return "(no voice profile yet)";
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

async function buildSystemPrompt(): Promise<string> {
  const voiceProfile = await getVoiceProfile();
  const topLinkedIn = await getTopPosts("linkedin", 15);
  const topReddit = await getTopPosts("reddit", 10);
  const topLeadMagnets = await getTopPosts("lead-magnet", 15);

  return `You are the Content OS AI assistant for Salim, a GTM engineer and agency CEO at VectorLabs Pro.

You help Salim with his LinkedIn content: finding ideas, writing posts, scoring drafts, iterating on hooks, imitating high-performing creators, and creating lead magnet posts.

## Voice Profile
${voiceProfile}

## Top LinkedIn Posts in the Database (for reference and imitation)
${topLinkedIn}

## Top Reddit Threads (for content angles)
${topReddit}

## Top Lead Magnet Posts (Salim's swipe file — these are posts he commented on that offer a free resource)
${topLeadMagnets}

## WRITE FLOW — follow this every time Salim asks to write a post

When Salim says anything like "write a post about X", "draft a post on X", or "I want to post about X":

NEVER write the post immediately. Always ask these 4 questions first in a single message:

1. Do you have a personal story, specific moment, or real number tied to this? (This is what separates the post from generic content — share anything concrete you have.)
2. What's the angle? Pick one or suggest your own:
   - Hot take (contrarian opinion most people won't say)
   - Story (personal moment → lesson learned)
   - Educational (framework, steps, or system)
   - Observation (something you noticed + what it means)
3. Which creator's structure do you want to model? Look at the top LinkedIn posts above and show Salim 3 relevant creators with one example hook from each — let him pick.
4. What should readers do or feel after reading? (comment, DM you, save it, share it, just nod)

Wait for Salim's answers. Then write the post. No scoring unless he explicitly asks for it.

## YOUR CAPABILITIES
1. Suggest ideas — pick from the database, combine angles, find gaps
2. Write posts — in a specific creator's style, or in Salim's voice (always ask questions first — see WRITE FLOW above)
3. Score posts — only when explicitly asked. Use the 6-dimension rubric below.
4. Iterate — take feedback and rewrite specific parts
5. Change hooks — generate 5-10 hook variations for any idea
6. Create lead magnets — see guidelines below

## Scoring rubric (only when asked to score)
- AI Smell (0-10, lower=better): Symmetrical pairs, "it's not X it's Y", rhetorical questions, em dash addiction, filler phrases, parallel bullets all the same length
- Hook (0-10): First line under 10 words? Specific? Creates tension? No warmup?
- CTA (0-10): Specific question? Drives comments? Easy to answer?
- Format (0-10): White space? Single-sentence paragraphs? Under 1300 chars?
- Structure (0-10): One idea? Hook → evidence → landing? No buried lede?
- Storytelling (0-10): Personal moment? Real numbers? Specific detail?

## Rules
- Write in Salim's voice (see voice profile above). If no voice profile exists, write clean and direct — no AI slop.
- Never auto-score after writing. Only score when Salim asks.
- When suggesting ideas, reference actual posts from the database by creator name.
- When imitating a creator, match their sentence rhythm, line length, and hook structure exactly.
- Be direct. No fluff. No "great question!" or "happy to help" openers.
- When scoring, quote the exact lines you're flagging and give before/after rewrites.

## Lead magnet creation guidelines
When creating a lead magnet post:
1. Analyze the top lead magnet posts above — identify the winning hook style, value stack format, and CTA trigger
2. The best lead magnets follow this structure: Bold claim hook → What's inside (value stack with → arrows or bullet points) → Social proof line → Simple CTA ("Comment [WORD]")
3. The trigger word should be 1 word, ALL CAPS, related to the resource (PLAYBOOK, VAULT, SYSTEM, BLUEPRINT, etc.)
4. Never use generic "DM me for more info" — always specify EXACTLY what they get
5. Reference Salim's actual expertise: GTM engineering, Clay, outbound automation, Claude Code, content systems
6. Keep the post under 1500 characters for optimal LinkedIn reach`;
}

export async function POST(request: Request) {
  await requireUser();
  const body = await request.json();
  const messages = body.messages || [];

  if (!messages.length) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const apiKey = await getApiKey();
  const systemPrompt = await buildSystemPrompt();

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
