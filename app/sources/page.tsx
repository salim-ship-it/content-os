import { readSources } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { SourcesClient } from "./sources-client";
export const dynamic = "force-dynamic";
export default async function SourcesPage() {
  const userId = await requireUser();
  const sources = await readSources(userId);
  return <SourcesClient initialSources={sources} />;
}
