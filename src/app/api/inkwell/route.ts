import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateDumpSchema } from "@/lib/validations";
import { getSession } from "@/lib/session";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  // Check Authorization: Bearer <EXTENSION_API_KEY> (for Chrome extension)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);
    const expectedKey = process.env.EXTENSION_API_KEY;
    const userId = process.env.EXTENSION_USER_ID;
    if (expectedKey && userId && apiKey === expectedKey) {
      return userId;
    }
  }

  // Fall back to session cookie
  const session = await getSession();
  return session?.user.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const [dumps, total] = await Promise.all([
      prisma.brainDump.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.brainDump.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({ dumps, total, page, limit });
  } catch (error) {
    console.error("GET /api/inkwell error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brain dumps" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateDumpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, tags } = parsed.data;

    // Parse inline #tags from content
    const inlineTags = Array.from(
      content.matchAll(/#([a-zA-Z0-9_]+)/g),
      (m) => m[1]
    );
    const allTags = Array.from(new Set([...tags, ...inlineTags]));

    const dump = await prisma.brainDump.create({
      data: {
        content,
        tags: allTags,
        location: "Pune",
        userId,
      },
    });

    // Fire-and-forget: process the dump with AI after response is sent
    after(async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const internalKey = process.env.INTERNAL_API_KEY;
      if (!internalKey) return;
      try {
        await fetch(`${appUrl}/api/inkwell/${dump.id}/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": internalKey,
          },
        });
      } catch (err) {
        console.error("Fire-and-forget process failed for dump", dump.id, err);
      }
    });

    return NextResponse.json(dump, { status: 201 });
  } catch (error) {
    console.error("POST /api/inkwell error:", error);
    return NextResponse.json(
      { error: "Failed to create brain dump" },
      { status: 500 }
    );
  }
}
