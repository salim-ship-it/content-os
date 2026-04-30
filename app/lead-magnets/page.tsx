import { requireUser } from "@/lib/auth";
import { LeadMagnetsClient } from "./lead-magnets-client";
export const dynamic = "force-dynamic";
export default async function LeadMagnetsPage() {
  await requireUser();
  return <LeadMagnetsClient />;
}
