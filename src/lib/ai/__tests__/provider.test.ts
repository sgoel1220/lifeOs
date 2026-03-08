import { describe, it, expect, mock } from "bun:test";
import type { AIProvider, Message } from "../types";

describe("AIProvider interface", () => {
  it("mock provider satisfies AIProvider interface", async () => {
    const mockProvider: AIProvider = {
      chat: mock(async (_messages: Message[]) => "[]"),
    };

    const result = await mockProvider.chat([
      { role: "user", content: "test" },
    ]);

    expect(result).toBe("[]");
    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
  });

  it("mock provider can be swapped for real provider", async () => {
    const responses: string[] = [];

    const providerA: AIProvider = {
      chat: async () => '["response from A"]',
    };

    const providerB: AIProvider = {
      chat: async () => '["response from B"]',
    };

    for (const provider of [providerA, providerB]) {
      responses.push(await provider.chat([{ role: "user", content: "hi" }]));
    }

    expect(responses[0]).toContain("A");
    expect(responses[1]).toContain("B");
  });

  it("provider options are passed through", async () => {
    const capturedOptions: Record<string, unknown>[] = [];

    const trackingProvider: AIProvider = {
      chat: async (_messages, options) => {
        capturedOptions.push(options ?? {});
        return "ok";
      },
    };

    await trackingProvider.chat([], {
      model: "test-model",
      temperature: 0.5,
      maxTokens: 512,
    });

    expect(capturedOptions[0]).toMatchObject({
      model: "test-model",
      temperature: 0.5,
      maxTokens: 512,
    });
  });
});
