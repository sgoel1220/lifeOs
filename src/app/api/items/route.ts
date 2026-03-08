import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);
    const expectedKey = process.env.EXTENSION_API_KEY;
    const userId = process.env.EXTENSION_USER_ID;
    if (expectedKey && userId && apiKey === expectedKey) {
      return userId;
    }
  }
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
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? "PENDING";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type ? { type } : {}),
      status,
    };

    const [items, total] = await Promise.all([
      prisma.processedItem.findMany({
        where,
        orderBy: [
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
        include: {
          source: {
            select: { content: true, createdAt: true },
          },
        },
      }),
      prisma.processedItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
