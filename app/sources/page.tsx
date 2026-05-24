import { readSources } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";
import { SourcesClient } from "./sources-client";
export const dynamic = "force-dynamic";
export default async function SourcesPage() {
  const userId = await requireUser();
  const [sources, language] = await Promise.all([
    readSources(userId),
    getUserLanguage(),
  ]);
  return <SourcesClient initialSources={sources} language={language} />;
}
