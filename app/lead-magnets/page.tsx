import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";
import { LeadMagnetsClient } from "./lead-magnets-client";
export const dynamic = "force-dynamic";
export default async function LeadMagnetsPage() {
  await requireUser();
  const language = await getUserLanguage();
  return <LeadMagnetsClient language={language} />;
}
