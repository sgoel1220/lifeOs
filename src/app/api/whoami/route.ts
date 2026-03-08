import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json({ userId: session.user.id, email: session.user.email });
}
