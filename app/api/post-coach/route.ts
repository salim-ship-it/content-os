import { readCoachCache, generateCoachAnalysis } from "@/lib/post-coach";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();
  const cached = await readCoachCache();
  return Response.json({ analysis: cached });
}

export async function POST() {
  await requireUser();
  try {
    const analysis = await generateCoachAnalysis();
    return Response.json({ analysis });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate analysis";
    return Response.json({ error: msg }, { status: 500 });
  }
}
