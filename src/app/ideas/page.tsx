import { redirect } from "next/navigation";
import IdeasPageClient from "@/components/pages/IdeasPageClient";
import { getSession } from "@/lib/session";

export default async function IdeasPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return <IdeasPageClient />;
}
