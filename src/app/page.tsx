import { redirect } from "next/navigation";
import DashboardPageClient from "@/components/pages/DashboardPageClient";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  return <DashboardPageClient />;
}
