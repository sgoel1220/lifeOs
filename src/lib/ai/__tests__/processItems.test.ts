import { describe, it, expect } from "bun:test";
import type { AIProvider } from "../types";

// Inline the parsing logic to test it in isolation
function parseAIResponse(raw: string): Array<Record<string, unknown>> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  const ITEM_TYPES = ["TASK", "IDEA", "JOURNAL", "REMINDER", "NOTE"];
  return parsed.filter((item): item is Record<string, unknown> => {
    return (
      item &&
      typeof item === "object" &&
      typeof item.title === "string" &&
      (item.title as string).length > 0 &&
      ITEM_TYPES.includes(item.type as string)
    );
  });
}

async function processWithMock(
  content: string,
  mockResponse: string,
  provider?: AIProvider
): Promise<Array<Record<string, unknown>>> {
  const mockProvider = provider ?? {
    chat: async () => mockResponse,
  };
  const raw = await mockProvider.chat([{ role: "user", content }]);
  try {
    return parseAIResponse(raw);
  } catch {
    return [];
  }
}

describe("AI response parsing", () => {
  it("parses a TASK item correctly", async () => {
    const mockResponse = JSON.stringify([
      {
        type: "TASK",
        title: "Call dentist",
        body: "Schedule a dental appointment",
        dueDate: "2026-03-09T00:00:00.000Z",
        priority: "HIGH",
        metadata: { steps: ["Find dentist number", "Call to book"] },
      },
    ]);

    const items = await processWithMock("call dentist tomorrow", mockResponse);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("TASK");
    expect(items[0].title).toBe("Call dentist");
    expect(items[0].priority).toBe("HIGH");
  });

  it("parses multiple items from one dump", async () => {
    const mockResponse = JSON.stringify([
      { type: "TASK", title: "Call dentist", body: null, dueDate: null, priority: null, metadata: {} },
      {
        type: "IDEA",
        title: "Dog walking app",
        body: "AI-powered dog walking marketplace",
        dueDate: null,
        priority: null,
        metadata: {
          whyItMatters: "Solves pet owner pain",
          nextSteps: ["Research market", "Build MVP", "Find co-founder"],
          risks: ["Competition"],
        },
      },
    ]);

    const items = await processWithMock(
      "call dentist tomorrow and I have a startup idea: dog walking app with AI",
      mockResponse
    );
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe("TASK");
    expect(items[1].type).toBe("IDEA");
  });

  it("returns [] for empty dump with no actionable content", async () => {
    const items = await processWithMock("hmm", "[]");
    expect(items).toHaveLength(0);
  });

  it("returns [] on malformed JSON from AI", async () => {
    const items = await processWithMock("test", "this is not json at all");
    expect(items).toHaveLength(0);
  });

  it("filters out items with invalid types", async () => {
    const mockResponse = JSON.stringify([
      { type: "INVALID_TYPE", title: "Bad item", body: null },
      { type: "TASK", title: "Valid task", body: null, dueDate: null, priority: null, metadata: {} },
    ]);

    const items = await processWithMock("test", mockResponse);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("TASK");
  });

  it("filters out items with missing title", async () => {
    const mockResponse = JSON.stringify([
      { type: "TASK", title: "", body: null },
      { type: "TASK", body: null },
      { type: "NOTE", title: "Valid note", body: null, dueDate: null, priority: null, metadata: {} },
    ]);

    const items = await processWithMock("test", mockResponse);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("NOTE");
  });

  it("strips markdown code fences from AI response", async () => {
    const inner = JSON.stringify([
      { type: "TASK", title: "Test", body: null, dueDate: null, priority: null, metadata: {} },
    ]);
    const withFences = "```json\n" + inner + "\n```";
    const items = await processWithMock("test", withFences);
    expect(items).toHaveLength(1);
  });

  it("infers due date from temporal language (via AI mock)", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0] + "T00:00:00.000Z";

    const mockResponse = JSON.stringify([
      {
        type: "TASK",
        title: "Call dentist",
        body: null,
        dueDate: tomorrowISO,
        priority: "MEDIUM",
        metadata: {},
      },
    ]);

    const items = await processWithMock("call dentist tomorrow", mockResponse);
    expect(items[0].dueDate).toBe(tomorrowISO);
  });
});
