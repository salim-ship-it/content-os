import { requireUser } from "@/lib/auth";
import { ChatClient } from "./chat-client";
export const dynamic = "force-dynamic";
export default async function Home() {
  await requireUser();
  return <ChatClient />;
}
