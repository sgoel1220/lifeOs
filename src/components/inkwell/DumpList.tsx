"use client";

import { useInkwell } from "@/hooks/useInkwell";
import DumpCard from "./DumpCard";

function SkeletonCard() {
  return (
    <div className="bg-[#FFFDF8] border border-[#E8DDD0] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-[#F0EBE0] rounded w-3/4 mb-2" />
      <div className="h-4 bg-[#F0EBE0] rounded w-1/2 mb-3" />
      <div className="h-3 bg-[#F5F0E8] rounded w-24" />
    </div>
  );
}

export default function DumpList() {
  const { dumps, total, isLoading, isValidating, isError, deleteDump } =
    useInkwell();

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-[#C4956A] text-sm">
          Could not load thoughts. Check your connection.
        </p>
      </div>
    );
  }

  // Only show skeletons on a cold first visit (no cached data at all)
  if (isLoading && dumps.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (dumps.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🖋️</div>
        <p className="text-[#8BAF7C] font-serif text-lg mb-1">
          Your inkwell is empty
        </p>
        <p className="text-sm text-[#C4B8A8]">
          Start capturing thoughts above. They&apos;ll appear here instantly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#C4B8A8] font-medium uppercase tracking-wider">
          {total} thought{total !== 1 ? "s" : ""} captured
        </p>
        {isValidating && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#8BAF7C] animate-pulse" />
        )}
      </div>

      <div className="space-y-3">
        {dumps.map((dump) => (
          <DumpCard key={dump.id} dump={dump} onDelete={deleteDump} />
        ))}
      </div>
    </div>
  );
}
