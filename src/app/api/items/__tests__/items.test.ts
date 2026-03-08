import { describe, it, expect, mock } from "bun:test";

// Test the items API filtering and ownership logic in isolation

interface MockItem {
  id: string;
  userId: string;
  type: string;
  status: string;
  title: string;
  dueDate: string | null;
}

const ITEMS: MockItem[] = [
  { id: "1", userId: "u1", type: "TASK", status: "PENDING", title: "Call dentist", dueDate: "2026-03-09" },
  { id: "2", userId: "u1", type: "TASK", status: "DONE", title: "Buy groceries", dueDate: null },
  { id: "3", userId: "u1", type: "IDEA", status: "PENDING", title: "Dog walking app", dueDate: null },
  { id: "4", userId: "u2", type: "TASK", status: "PENDING", title: "Another user task", dueDate: null },
];

function filterItems(userId: string, type?: string, status?: string): MockItem[] {
  return ITEMS.filter(
    (i) =>
      i.userId === userId &&
      (type ? i.type === type : true) &&
      (status ? i.status === status : true)
  );
}

async function handleGet(params: {
  userId: string | null;
  type?: string;
  status?: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!params.userId) return { status: 401, body: { error: "Unauthorized" } };
  const items = filterItems(params.userId, params.type, params.status ?? "PENDING");
  return { status: 200, body: { items, total: items.length } };
}

async function handlePatch(params: {
  userId: string | null;
  itemId: string;
  newStatus: string;
  dbUpdate: (id: string, status: string) => Promise<MockItem>;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!params.userId) return { status: 401, body: { error: "Unauthorized" } };
  const item = ITEMS.find((i) => i.id === params.itemId);
  if (!item) return { status: 404, body: { error: "Not found" } };
  if (item.userId !== params.userId) return { status: 403, body: { error: "Forbidden" } };
  const updated = await params.dbUpdate(params.itemId, params.newStatus);
  return { status: 200, body: updated };
}

describe("Items API logic", () => {
  describe("GET /api/items", () => {
    it("returns 401 for unauthenticated request", async () => {
      const result = await handleGet({ userId: null });
      expect(result.status).toBe(401);
    });

    it("filters by type=TASK and status=PENDING", async () => {
      const result = await handleGet({ userId: "u1", type: "TASK", status: "PENDING" });
      expect(result.status).toBe(200);
      const { items } = result.body as { items: MockItem[] };
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe("TASK");
      expect(items[0].status).toBe("PENDING");
    });

    it("filters by type=IDEA", async () => {
      const result = await handleGet({ userId: "u1", type: "IDEA", status: "PENDING" });
      expect(result.status).toBe(200);
      const { items } = result.body as { items: MockItem[] };
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("3");
    });

    it("does not return items from other users", async () => {
      const result = await handleGet({ userId: "u1", type: "TASK", status: "PENDING" });
      const { items } = result.body as { items: MockItem[] };
      expect(items.every((i: MockItem) => i.userId === "u1")).toBe(true);
    });

    it("returns all types when no type filter", async () => {
      const result = await handleGet({ userId: "u1", status: "PENDING" });
      const { items } = result.body as { items: MockItem[] };
      const types = [...new Set(items.map((i: MockItem) => i.type))];
      expect(types.length).toBeGreaterThan(1);
    });
  });

  describe("PATCH /api/items/[id]", () => {
    it("returns 401 for unauthenticated request", async () => {
      const result = await handlePatch({
        userId: null,
        itemId: "1",
        newStatus: "DONE",
        dbUpdate: mock(async () => ({ ...ITEMS[0], status: "DONE" })),
      });
      expect(result.status).toBe(401);
    });

    it("returns 403 when user does not own the item", async () => {
      const result = await handlePatch({
        userId: "u1",
        itemId: "4", // belongs to u2
        newStatus: "DONE",
        dbUpdate: mock(async () => ({ ...ITEMS[3], status: "DONE" })),
      });
      expect(result.status).toBe(403);
    });

    it("returns 404 for non-existent item", async () => {
      const result = await handlePatch({
        userId: "u1",
        itemId: "non-existent",
        newStatus: "DONE",
        dbUpdate: mock(async () => ITEMS[0]),
      });
      expect(result.status).toBe(404);
    });

    it("marks item as DONE for authorized user", async () => {
      const dbUpdate = mock(async (id: string, status: string) => ({ ...ITEMS[0], id, status }));
      const result = await handlePatch({
        userId: "u1",
        itemId: "1",
        newStatus: "DONE",
        dbUpdate,
      });
      expect(result.status).toBe(200);
      expect(dbUpdate).toHaveBeenCalledWith("1", "DONE");
    });

    it("marks item as ARCHIVED for authorized user", async () => {
      const dbUpdate = mock(async (id: string, status: string) => ({ ...ITEMS[2], id, status }));
      const result = await handlePatch({
        userId: "u1",
        itemId: "3",
        newStatus: "ARCHIVED",
        dbUpdate,
      });
      expect(result.status).toBe(200);
    });
  });
});
