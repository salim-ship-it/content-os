import { readCoachCache } from "@/lib/post-coach";
import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";
import { LearnClient } from "./learn-client";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  await requireUser();
  const [cachedAnalysis, language] = await Promise.all([
    readCoachCache(),
    getUserLanguage(),
  ]);
  return <LearnClient initialAnalysis={cachedAnalysis} language={language} />;
}
