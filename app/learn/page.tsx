import { readCoachCache } from "@/lib/post-coach";
import { requireUser } from "@/lib/auth";
import { LearnClient } from "./learn-client";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  await requireUser();
  const cachedAnalysis = await readCoachCache();
  return <LearnClient initialAnalysis={cachedAnalysis} />;
}
