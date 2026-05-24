import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { readSources } from "@/lib/sources";
import { getUserLanguage } from "@/lib/get-user-language";
import { ChatClient } from "./chat-client";
export const dynamic = "force-dynamic";
export default async function Home() {
  const userId = await requireUser();
  const [sources, language] = await Promise.all([
    readSources(userId),
    getUserLanguage(),
  ]);
  const hasLinkedInCreator = sources.some((s) => s.kind === "linkedin");
  if (!hasLinkedInCreator) redirect("/onboarding/creators");
  return <ChatClient language={language} />;
}
