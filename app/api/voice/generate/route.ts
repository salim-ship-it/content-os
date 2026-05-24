import { readVoiceDraft, writeVoiceProfile } from "@/lib/voice-storage";
import { requireUser } from "@/lib/auth";
import { VOICE_QUESTIONS } from "@/lib/voice-questions";
import { REPO_ROOT } from "@/lib/paths";
import {
  generatePillars,
  readOnboarding,
  renderPillarsMarkdown,
  writePillars,
  writePillarsMarkdown,
} from "@/lib/pillars";
import { claudeFetch } from "@/lib/claude-fetch";
import { getUserLanguage } from "@/lib/get-user-language";
import { promises as fs } from "fs";
import path from "path";

export async function POST() {
  const userId = await requireUser();
  const draft = await readVoiceDraft(userId);
  if (!draft || Object.keys(draft.answers).length === 0) {
    return Response.json({ error: "No answers found" }, { status: 400 });
  }

  // Load API key from .env.local at repo root
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    try {
      const envPath = path.join(REPO_ROOT, ".env.local");
      const envRaw = await fs.readFile(envPath, "utf-8");
      for (const line of envRaw.split("\n")) {
        const match = line.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/);
        if (match) {
          apiKey = match[1].trim().replace(/^["']|["']$/g, "");
          break;
        }
      }
    } catch {}
  }

  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not found" }, { status: 500 });
  }

  // Build the answers summary
  const answersSummary = VOICE_QUESTIONS.map((q) => {
    const answer = draft.answers[q.id];
    const formatted = Array.isArray(answer) ? answer.join(", ") : answer ?? "(skipped)";
    return `**${q.question}**\n${formatted}`;
  }).join("\n\n");

  const language = await getUserLanguage();

  const systemPromptEn = `You are a voice profile synthesizer for a LinkedIn content system. You will receive answers to 12 voice discovery questions. Your job is to synthesize these into a structured voice profile in markdown format.

The profile must have these sections:
1. **Identity** — Who they are, what they do, their positioning
2. **Core beliefs** — What they believe most people get wrong, their contrarian takes
3. **Origin story** — The defining moment(s) that shaped their approach
4. **Voice mechanics** — Sentence rhythm, paragraph style, vocabulary register
5. **Hard nos** — Phrases and patterns they refuse to use
6. **Audience** — Who they write for, who their ideal reader is
7. **Tone calibration** — Humor, swearing, formality levels, how they end posts
8. **Coffee baseline** — How they naturally talk about their work (most authentic voice sample)
9. **Application notes** — Practical rules for an AI ghostwriter to follow when writing in this voice

Be specific and actionable. Use their actual words where possible. This profile will be used by an AI to write LinkedIn posts in their voice.`;

  const systemPromptAr = `أنت بتساعد على بناء ملف صوت لمنشورات لينكدإن. رح يوصلك ١٢ إجابة على أسئلة شخصية، ولازم تطلعها بصيغة Markdown مرتبة وواضحة.

## قاعدة اللغة (مهم جدًا)
اكتب كل شي بالعربي السهل اللي أي عربي يفهمه — مش فصحى ثقيلة، ومش ترجمة كلمة بكلمة من الإنجليزي. تخيل إنك تشرح لصديق على القهوة. كلمات عادية، جمل قصيرة، مفهومة من أول قراءة.

- ممنوع: عبارات مترجمة حرفيًا، تعابير ثقيلة، كلمات قديمة ما حدا يستعملها
- مطلوب: عربي بسيط، حديث، مباشر — اللي بنكتبه ع لينكدإن وفي الواتساب
- خلي السطر يحكي زي ما الشخص بيحكي فعلًا، مش زي قاموس أو ترجمة قوقل

## الأقسام (استعمل هاي العناوين)
1. **هويتك** — مين أنت، شو بتعمل، وكيف بتقدم حالك
2. **قناعاتك الأساسية** — شو الناس غالبًا غلطانة فيه، وشو رأيك المختلف
3. **قصة البداية** — اللحظة اللي رسمت طريقك
4. **أسلوبك بالكتابة** — إيقاع جملك، طول الفقرات، نوع الكلمات
5. **اللي ما بتكتبه أبدًا** — كلمات وأساليب بترفضها
6. **جمهورك** — لمين بتكتب، مين القارئ المثالي
7. **نبرتك** — قديش بتمزح، رسمي ولا لأ، كيف بتسكر المنشور
8. **كيف بتحكي على القهوة** — هيك بتحكي عن شغلك بشكل طبيعي
9. **ملاحظات للذكاء الاصطناعي** — قواعد عملية لما يكتب بصوتك

كن محدد، عملي، واستعمل كلمات الشخص الفعلية لما يمكن. هاد الملف رح يستعمله الذكاء الاصطناعي ليكتب منشورات لينكدإن بصوته.`;

  const systemPrompt = language === "ar" ? systemPromptAr : systemPromptEn;
  const userPrompt = language === "ar"
    ? `هاي إجابات الـ ١٢ سؤال:\n\n${answersSummary}\n\nطلّع ملف صوت كامل بالعربي السهل، زي ما اتفقنا — مش ترجمة، مش فصحى ثقيلة.`
    : `Here are the answers to the 12 voice discovery questions:\n\n${answersSummary}\n\nSynthesize these into a complete voice profile.`;

  const response = await claudeFetch(apiKey, {
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  if (!response.ok) {
    const err = await response.text();
    return Response.json({ error: `Claude API error: ${err}` }, { status: 500 });
  }

  const result = await response.json();
  const content =
    result.content?.[0]?.text ?? "Error: no content returned from Claude";

  await writeVoiceProfile(userId, content);

  let pillars = null;
  let pillarsError: string | null = null;
  try {
    const onboarding = await readOnboarding(userId);
    pillars = await generatePillars(draft, onboarding, apiKey, language);
    await writePillars(userId, pillars);
    const md = renderPillarsMarkdown(onboarding?.name ?? "Unknown", pillars);
    await writePillarsMarkdown(userId, md);
  } catch (err) {
    pillarsError = err instanceof Error ? err.message : String(err);
  }

  return Response.json({ ok: true, profile: content, pillars, pillarsError, saved: true });
}
