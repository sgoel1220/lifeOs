import { redirect } from "next/navigation";
import TasksPageClient from "@/components/pages/TasksPageClient";
import { getSession } from "@/lib/session";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return <TasksPageClient />;
}
