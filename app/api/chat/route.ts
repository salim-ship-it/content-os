import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { REPO_ROOT, VOICE_PROFILE_PATH, POST_FORMATS_PATH, CREATOR_STYLES_DIR } from "@/lib/paths";
import { claudeFetch } from "@/lib/claude-fetch";

const MODEL = "claude-haiku-4-5-20251001";

async function getPersonalization(): Promise<any> {
  try {
    const configPath = path.join(REPO_ROOT, "config", "personalization.json");
    const configData = await fs.readFile(configPath, "utf-8");
    return JSON.parse(configData);
  } catch {
    return {
      user: {
        name: "User",
        title: "Content Creator",
        company: "Your Company",
        expertise: ["content", "LinkedIn", "lead generation"],
        description: "A content creator focused on LinkedIn",
      },
    };
  }
}

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

async function buildSystemPrompt(): Promise<string> {
  const [voiceProfile, postFormats, creatorStyles, topLinkedIn, topReddit, topLeadMagnets, personalization] =
    await Promise.all([
      getVoiceProfile(),
      getPostFormats(),
      getCreatorStyles(),
      getTopPosts("linkedin", 15),
      getTopPosts("reddit", 10),
      getTopPosts("lead-magnet", 15),
      getPersonalization(),
    ]);

  const { user } = personalization;
  const userDescription = `${user.name}, ${user.title}${user.company ? ` at ${user.company}` : ""}`;

  return `You are the Content OS AI assistant for ${userDescription}.

You help ${user.name} with their LinkedIn content: finding ideas, writing posts, scoring drafts, iterating on hooks, imitating high-performing creators, and creating lead magnet posts.

## Voice Profile
${voiceProfile}

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

## WRITE FLOW — follow this every time the user asks to write a post

When the user says anything like "write a post about X", "draft a post on X", or "I want to post about X":

NEVER write the post immediately. Always ask these 4 questions first in a single message.

Start with this line before the questions:
"The more detail and thought you put into these answers, the more the post will sound exactly how you want it."

1. Do you have a personal story, specific moment, or real number tied to this? (This is what separates the post from generic content — share anything concrete you have.)
2. What's the angle? Pick one or suggest your own:
   - Hot take (contrarian opinion most people won't say)
   - Story (personal moment → lesson learned)
   - Educational (framework, steps, or system)
   - Observation (something you noticed + what it means)
3. Which creator's structure do you want to model? Look at the Creator Style Guides above and show the user 3 relevant creators with one real hook example from each (taken from their actual posts in the guides) — let him pick.
4. What should readers do or feel after reading? (comment, DM you, save it, share it, just nod)

Wait for the user's answers. Then write the post using the chosen creator's actual hook structure, sentence rhythm, and format — not a generic version of it. No scoring unless he explicitly asks for it.

## HOOK RULE — critical
When the user picks a creator, go to that creator's style guide above. Find their real hook patterns. Use those patterns to structure the hook. NEVER invent a hook from scratch. NEVER cut a phrase from the content and call it a hook. The hook must follow the creator's documented hook formula.

## YOUR CAPABILITIES
1. Suggest ideas — pick from the database, combine angles, find gaps
2. Write posts — in a specific creator's style, or in the user's voice (always ask questions first — see WRITE FLOW above)
3. Score posts — only when explicitly asked. Use the 6-dimension rubric below.
4. Iterate — take feedback and rewrite specific parts
5. Change hooks — generate 5-10 hook variations for any idea, all using the chosen creator's real hook patterns
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
- When suggesting ideas, reference actual posts from the database by creator name.
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
