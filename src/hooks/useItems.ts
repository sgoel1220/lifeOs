"use client";

import useSWR from "swr";

export interface ProcessedItem {
  id: string;
  userId: string;
  sourceId: string | null;
  type: string;
  status: string;
  title: string;
  body: string | null;
  dueDate: string | null;
  priority: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  source?: {
    content: string;
    createdAt: string;
  } | null;
}

interface ItemsResponse {
  items: ProcessedItem[];
  total: number;
  page: number;
  limit: number;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error("Failed to fetch");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
};

function buildUrl(type?: string, status?: string): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  return `/api/items?${params.toString()}`;
}

export function useItems(type?: string, status = "PENDING") {
  const key = buildUrl(type, status);
  const { data, error, isLoading, mutate } = useSWR<ItemsResponse>(key, fetcher, {
    keepPreviousData: true,
  });

  const markDone = async (id: string) => {
    const previous = data;
    await mutate(
      (current) => ({
        items: (current?.items ?? []).filter((i) => i.id !== id),
        total: Math.max(0, (current?.total ?? 0) - 1),
        page: current?.page ?? 1,
        limit: current?.limit ?? 50,
      }),
      false
    );
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!res.ok) throw new Error("Failed to mark done");
    } catch (err) {
      await mutate(previous, false);
      throw err;
    }
  };

  const markArchived = async (id: string) => {
    const previous = data;
    await mutate(
      (current) => ({
        items: (current?.items ?? []).filter((i) => i.id !== id),
        total: Math.max(0, (current?.total ?? 0) - 1),
        page: current?.page ?? 1,
        limit: current?.limit ?? 50,
      }),
      false
    );
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Failed to archive");
    } catch (err) {
      await mutate(previous, false);
      throw err;
    }
  };

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    markDone,
    markArchived,
    refresh: mutate,
  };
}
