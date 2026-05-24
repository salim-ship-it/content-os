import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";
import { PreviewClient } from "./preview-client";
export const dynamic = "force-dynamic";
export default async function PreviewPage() {
  await requireUser();
  const language = await getUserLanguage();
  return <PreviewClient language={language} />;
}
