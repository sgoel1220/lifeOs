import OpenAI from "openai";
import type { AIProvider, Message, ChatOptions } from "./types";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const openRouterProvider: AIProvider = {
  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const res = await client.chat.completions.create({
      model: options?.model ?? process.env.AI_MODEL ?? "anthropic/claude-haiku-4-5",
      messages,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.3,
    });
    return res.choices[0].message.content ?? "";
  },
};
