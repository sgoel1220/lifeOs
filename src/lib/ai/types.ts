export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
}
