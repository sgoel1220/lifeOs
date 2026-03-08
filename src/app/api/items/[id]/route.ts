import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { UpdateItemSchema } from "@/lib/validations";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const item = await prisma.processedItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (item.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.processedItem.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
