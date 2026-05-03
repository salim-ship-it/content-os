import { requireUser } from "@/lib/auth";
import { readSources } from "@/lib/sources";
import { INDUSTRIES, MAX_CREATORS_PER_USER } from "@/lib/recommended-creators";
import { CreatorsOnboardingClient } from "./creators-client";

export const dynamic = "force-dynamic";

export default async function CreatorsOnboardingPage() {
  const userId = await requireUser();
  const existing = await readSources(userId);
  const existingLinkedInUrls = existing.filter((s) => s.kind === "linkedin").map((s) => s.url);

  return (
    <CreatorsOnboardingClient
      industries={INDUSTRIES}
      maxCreators={MAX_CREATORS_PER_USER}
      existingUrls={existingLinkedInUrls}
    />
  );
}
