import { requireUser } from "@/lib/auth";
import { AnalyticsClient } from "./analytics-client";
export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  await requireUser();
  return <AnalyticsClient />;
}
