import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";

export default async function SignInPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return <AuthForm mode="sign-in" />;
}
