import { getSupabaseServer } from "@/lib/supabase-server";

export type CreatorProfile = {
  name: string;
  slug: string;
  profile_url: string;
  image_url: string;
  headline?: string;
  updated_at: string;
};

export async function readCreatorProfile(userId: string, slug: string): Promise<CreatorProfile | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_creator_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();
  if (!data) return null;
  return {
    name: data.name,
    slug: data.slug,
    profile_url: data.profile_url ?? "",
    image_url: data.image_url ?? "",
    headline: data.headline ?? undefined,
    updated_at: data.updated_at,
  };
}

export async function readAllCreatorProfiles(userId: string): Promise<Record<string, CreatorProfile>> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_creator_profiles")
    .select("*")
    .eq("user_id", userId);
  if (!data) return {};
  const result: Record<string, CreatorProfile> = {};
  for (const row of data) {
    result[row.slug] = {
      name: row.name,
      slug: row.slug,
      profile_url: row.profile_url ?? "",
      image_url: row.image_url ?? "",
      headline: row.headline ?? undefined,
      updated_at: row.updated_at,
    };
  }
  return result;
}
