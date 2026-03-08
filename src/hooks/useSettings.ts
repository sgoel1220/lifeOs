"use client";

import { useState, useEffect, useCallback } from "react";

export const AI_MODELS = [
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    badge: "fast",
    description: "Anthropic's fast, capable model",
  },
  {
    id: "deepseek/deepseek-v3.2",
    label: "DeepSeek V3.2",
    badge: "cheap",
    description: "Cost-effective, high-quality model",
  },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["id"];

const STORAGE_KEY = "lifeos:aiModel";
const DEFAULT_MODEL: AIModelId = "anthropic/claude-haiku-4-5";

export function useSettings() {
  const [model, setModelState] = useState<string>(DEFAULT_MODEL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setModelState(stored);
    setHydrated(true);
  }, []);

  const setModel = useCallback((m: string) => {
    setModelState(m);
    localStorage.setItem(STORAGE_KEY, m);
  }, []);

  return { model, setModel, hydrated };
}
