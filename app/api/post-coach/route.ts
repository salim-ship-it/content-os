import { readCoachCache, generateCoachAnalysis } from "@/lib/post-coach";
import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";

export async function GET() {
  await requireUser();
  const cached = await readCoachCache();
  return Response.json({ analysis: cached });
}

export async function POST() {
  await requireUser();
  const language = await getUserLanguage();
  try {
    const analysis = await generateCoachAnalysis(language);
    return Response.json({ analysis });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : language === "ar" ? "فشل إنشاء التحليل" : "Failed to generate analysis";
    return Response.json({ error: msg }, { status: 500 });
  }
}
