import { createClient } from "@supabase/supabase-js";
import { CapterraDashboard } from "./dashboard-client";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_JWT || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export default async function CapterraInsightsPage() {
  const supabase = getSupabase();
  const { data: reviews, error } = await supabase
    .from("capterra_reviews")
    .select("*")
    .order("review_date", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading reviews: {error.message}</p>
      </div>
    );
  }

  return <CapterraDashboard reviews={reviews || []} />;
}
