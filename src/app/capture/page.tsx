import { redirect } from "next/navigation";
import CapturePageClient from "@/components/pages/CapturePageClient";
import { getSession } from "@/lib/session";

export default async function CapturePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  return <CapturePageClient />;
}
