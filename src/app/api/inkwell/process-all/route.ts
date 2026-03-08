import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let model: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.model === "string" && body.model.length > 0) {
      model = body.model;
    }
  } catch {}

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const pending = await prisma.brainDump.findMany({
    where: { userId, processed: false },
    select: { id: true },
  });

  if (pending.length === 0) {
    return NextResponse.json({ total: 0, processed: 0, failed: 0 });
  }

  let processed = 0;
  let failed = 0;

  await Promise.all(
    pending.map(async ({ id }) => {
      try {
        const res = await fetch(`${appUrl}/api/inkwell/${id}/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": internalKey,
          },
          body: JSON.stringify({ model }),
        });
        if (res.ok) processed++;
        else failed++;
      } catch {
        failed++;
      }
    })
  );

  return NextResponse.json({ total: pending.length, processed, failed });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const count = await prisma.brainDump.count({
    where: { userId, processed: false },
  });

  return NextResponse.json({ unprocessed: count });
}
