import { getUserLanguage } from "@/lib/get-user-language";
import { ImageClient } from "./image-client";
export const dynamic = "force-dynamic";

export default async function ImagePage() {
  const language = await getUserLanguage();
  return <ImageClient language={language} />;
}
