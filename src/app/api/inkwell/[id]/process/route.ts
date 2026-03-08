import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aiProvider } from "@/lib/ai";

interface ProcessedItemInput {
  type: string;
  title: string;
  body?: string;
  dueDate?: string | null;
  priority?: string | null;
  metadata?: Record<string, unknown>;
}

const ITEM_TYPES = ["TASK", "IDEA", "JOURNAL", "REMINDER", "NOTE"];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

function buildPrompt(content: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `You are a personal life organizer. Analyze this brain dump and extract structured items.
Today's date: ${today}
Brain dump: "${content}"

Return ONLY a valid JSON array (no markdown, no explanation). Each item in the array:
{
  "type": "TASK" | "IDEA" | "JOURNAL" | "REMINDER" | "NOTE",
  "title": "concise title (max 80 chars)",
  "body": "enriched description or null",
  "dueDate": "ISO 8601 date string or null",
  "priority": "HIGH" | "MEDIUM" | "LOW" | null,
  "metadata": {
    // TASK: { "steps": ["step 1", "step 2"] }
    // IDEA: { "whyItMatters": "...", "nextSteps": ["...", "...", "..."], "risks": ["..."] }
    // JOURNAL: { "mood": "...", "themes": ["..."] }
    // REMINDER: { "message": "..." }
    // NOTE: { "category": "...", "tags": ["..."] }
  }
}

Rules:
- A single dump CAN produce multiple items
- TASK: clear actions, infer due dates from temporal language ("tomorrow", "next week", "Friday")
- IDEA: expand with WHY it matters + 3 concrete next steps
- JOURNAL: when dump is reflective or emotional
- Return [] if nothing meaningful to extract`;
}

function parseAIResponse(raw: string): ProcessedItemInput[] {
  // Strip markdown code blocks if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((item): item is ProcessedItemInput => {
    return (
      item &&
      typeof item === "object" &&
      typeof item.title === "string" &&
      item.title.length > 0 &&
      ITEM_TYPES.includes(item.type)
    );
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate internal key
  const internalKey = request.headers.get("x-internal-key");
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (!expectedKey || internalKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const dump = await prisma.brainDump.findUnique({ where: { id } });
    if (!dump) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Idempotent: skip if already processed
    if (dump.processed) {
      return NextResponse.json({ skipped: true });
    }

    const rawResponse = await aiProvider.chat([
      { role: "user", content: buildPrompt(dump.content) },
    ]);

    let items: ProcessedItemInput[] = [];
    try {
      items = parseAIResponse(rawResponse);
    } catch {
      console.error("Failed to parse AI response for dump", id, rawResponse);
      // Don't fail the request — just mark processed with 0 items
    }

    await prisma.$transaction(async (tx) => {
      if (items.length > 0 && dump.userId) {
        await tx.processedItem.createMany({
          data: items.map((item) => ({
            userId: dump.userId!,
            sourceId: dump.id,
            type: item.type,
            title: item.title.slice(0, 80),
            body: item.body ?? null,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            priority: item.priority && PRIORITIES.includes(item.priority) ? item.priority : null,
            metadata: item.metadata ? (item.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
          })),
        });
      }
      await tx.brainDump.update({
        where: { id },
        data: { processed: true },
      });
    });

    return NextResponse.json({ processed: items.length });
  } catch (error) {
    console.error("POST /api/inkwell/[id]/process error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
