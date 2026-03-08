"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { CreateDumpInput } from "@/lib/validations";

export interface BrainDump {
  id: string;
  content: string;
  tags: string[];
  location: string;
  createdAt: string;
  updatedAt: string;
}

interface InkwellResponse {
  dumps: BrainDump[];
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

export function useInkwell() {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<InkwellResponse>("/api/inkwell", fetcher, {
      keepPreviousData: true,
    });

  // Revalidate when the service worker syncs queued offline thoughts
  useEffect(() => {
    const handler = () => mutate();
    window.addEventListener("inkwell:synced", handler);
    return () => window.removeEventListener("inkwell:synced", handler);
  }, [mutate]);

  const createDump = async (
    input: CreateDumpInput,
    optimisticEntry?: BrainDump
  ) => {
    const tempId = optimisticEntry?.id ?? `temp-${Date.now()}`;
    const tempEntry: BrainDump = optimisticEntry ?? {
      id: tempId,
      content: input.content,
      tags: input.tags ?? [],
      location: "Pune",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    await mutate(
      (current) => ({
        dumps: [tempEntry, ...(current?.dumps ?? [])],
        total: (current?.total ?? 0) + 1,
        page: current?.page ?? 1,
        limit: current?.limit ?? 50,
      }),
      false
    );

    try {
      const response = await fetch("/api/inkwell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/sign-in";
          return;
        }
        throw new Error("Failed to create");
      }

      const created: BrainDump = await response.json();

      // Replace temp with real entry
      await mutate(
        (current) => ({
          dumps: (current?.dumps ?? []).map((d) =>
            d.id === tempId ? created : d
          ),
          total: current?.total ?? 1,
          page: current?.page ?? 1,
          limit: current?.limit ?? 50,
        }),
        false
      );

      return created;
    } catch (err) {
      // Rollback on error
      await mutate();
      throw err;
    }
  };

  const deleteDump = async (id: string) => {
    const previous = data;

    // Optimistic remove
    await mutate(
      (current) => ({
        dumps: (current?.dumps ?? []).filter((d) => d.id !== id),
        total: Math.max(0, (current?.total ?? 0) - 1),
        page: current?.page ?? 1,
        limit: current?.limit ?? 50,
      }),
      false
    );

    try {
      const response = await fetch(`/api/inkwell/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/sign-in";
          return;
        }
        throw new Error("Failed to delete");
      }
    } catch (err) {
      // Rollback
      await mutate(previous, false);
      throw err;
    }
  };

  return {
    dumps: data?.dumps ?? [],
    total: data?.total ?? 0,
    isLoading,
    isValidating,
    isError: !!error,
    createDump,
    deleteDump,
    refresh: mutate,
  };
}
