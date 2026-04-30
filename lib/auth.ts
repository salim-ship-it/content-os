import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function requireUser(): Promise<string> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}
