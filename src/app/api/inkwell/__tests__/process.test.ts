import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

// We test the logic, not the full Next.js route, to avoid needing a running server.
// These tests validate the core behaviors of the processing pipeline.

const VALID_KEY = "test-internal-key";

// Simulated route handler logic
async function handleProcess(params: {
  internalKey: string | null;
  dumpId: string;
  dump: { id: string; content: string; userId: string; processed: boolean } | null;
  aiResponse: string;
  dbCreateMany: (data: unknown[]) => Promise<void>;
  dbUpdate: (id: string) => Promise<void>;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const { internalKey, dump, aiResponse, dbCreateMany, dbUpdate } = params;

  if (internalKey !== VALID_KEY) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  if (!dump) {
    return { status: 404, body: { error: "Not found" } };
  }

  if (dump.processed) {
    return { status: 200, body: { skipped: true } };
  }

  let items: unknown[] = [];
  try {
    const parsed = JSON.parse(aiResponse);
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    // graceful fallback
  }

  const ITEM_TYPES = ["TASK", "IDEA", "JOURNAL", "REMINDER", "NOTE"];
  const validItems = items.filter((item): item is Record<string, unknown> => {
    return (
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).title === "string" &&
      ITEM_TYPES.includes((item as Record<string, unknown>).type as string)
    );
  });

  await dbCreateMany(validItems);
  await dbUpdate(dump.id);

  return { status: 200, body: { processed: validItems.length } };
}

describe("Process route logic", () => {
  it("returns 401 when internal key is missing", async () => {
    const result = await handleProcess({
      internalKey: null,
      dumpId: "dump1",
      dump: null,
      aiResponse: "[]",
      dbCreateMany: mock(async () => {}),
      dbUpdate: mock(async () => {}),
    });
    expect(result.status).toBe(401);
  });

  it("returns 401 when internal key is wrong", async () => {
    const result = await handleProcess({
      internalKey: "wrong-key",
      dumpId: "dump1",
      dump: null,
      aiResponse: "[]",
      dbCreateMany: mock(async () => {}),
      dbUpdate: mock(async () => {}),
    });
    expect(result.status).toBe(401);
  });

  it("returns 404 when dump does not exist", async () => {
    const result = await handleProcess({
      internalKey: VALID_KEY,
      dumpId: "dump1",
      dump: null,
      aiResponse: "[]",
      dbCreateMany: mock(async () => {}),
      dbUpdate: mock(async () => {}),
    });
    expect(result.status).toBe(404);
  });

  it("skips already processed dump (idempotent)", async () => {
    const createMany = mock(async () => {});
    const result = await handleProcess({
      internalKey: VALID_KEY,
      dumpId: "dump1",
      dump: { id: "dump1", content: "test", userId: "user1", processed: true },
      aiResponse: '[{"type":"TASK","title":"Test","body":null,"dueDate":null,"priority":null,"metadata":{}}]',
      dbCreateMany: createMany,
      dbUpdate: mock(async () => {}),
    });
    expect(result.status).toBe(200);
    expect(result.body.skipped).toBe(true);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("creates items and marks dump processed on valid AI response", async () => {
    const createMany = mock(async () => {});
    const update = mock(async () => {});
    const aiResponse = JSON.stringify([
      { type: "TASK", title: "Call dentist", body: null, dueDate: null, priority: null, metadata: {} },
    ]);

    const result = await handleProcess({
      internalKey: VALID_KEY,
      dumpId: "dump1",
      dump: { id: "dump1", content: "call dentist", userId: "user1", processed: false },
      aiResponse,
      dbCreateMany: createMany,
      dbUpdate: update,
    });

    expect(result.status).toBe(200);
    expect(result.body.processed).toBe(1);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("handles malformed JSON gracefully — marks processed with 0 items", async () => {
    const createMany = mock(async () => {});
    const update = mock(async () => {});

    const result = await handleProcess({
      internalKey: VALID_KEY,
      dumpId: "dump1",
      dump: { id: "dump1", content: "test", userId: "user1", processed: false },
      aiResponse: "this is not json",
      dbCreateMany: createMany,
      dbUpdate: update,
    });

    expect(result.status).toBe(200);
    expect(result.body.processed).toBe(0);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
