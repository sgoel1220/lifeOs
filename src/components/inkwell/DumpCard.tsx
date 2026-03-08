"use client";

import { useState } from "react";
import { BrainDump } from "@/hooks/useInkwell";
import { Badge } from "@/components/ui/badge";

interface DumpCardProps {
  dump: BrainDump;
  onDelete: (id: string) => void;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function highlightTags(content: string): React.ReactNode[] {
  const parts = content.split(/(#[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="text-[#8BAF7C] font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function DumpCard({ dump, onDelete }: DumpCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isTemp = dump.id.startsWith("temp-");

  const handleDeleteClick = () => {
    setShowConfirm(true);
    const timer = setTimeout(() => {
      onDelete(dump.id);
    }, 3000);
    setUndoTimer(timer);
  };

  const handleUndo = () => {
    if (undoTimer) clearTimeout(undoTimer);
    setUndoTimer(null);
    setShowConfirm(false);
  };

  return (
    <article
      className={`group bg-[#FFFDF8] border border-[#E8DDD0] rounded-xl p-4 transition-all duration-200 animate-slide-up ${
        isTemp ? "opacity-70" : "hover:border-[#C4D8BA] hover:shadow-sm"
      } ${showConfirm ? "border-red-200 bg-red-50/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[#2C2C2E] text-sm leading-relaxed flex-1 font-serif whitespace-pre-wrap break-words">
          {highlightTags(dump.content)}
        </p>

        {!showConfirm && !isTemp && (
          <button
            onClick={handleDeleteClick}
            className="shrink-0 text-[#D4C5B0] hover:text-red-400 transition-colors p-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        )}

        {isTemp && (
          <span className="shrink-0 w-3 h-3 border-2 border-[#8BAF7C]/40 border-t-[#8BAF7C] rounded-full animate-spin" />
        )}
      </div>

      {/* Tags */}
      {dump.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {dump.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[11px] text-[#8BAF7C] bg-[#F0EBE0] hover:bg-[#E8DDD0] px-2 py-0.5 rounded-full font-medium border-0"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2 text-[11px] text-[#C4B8A8]">
          <span>{formatRelativeTime(dump.createdAt)}</span>
          {dump.location && (
            <>
              <span>·</span>
              <span>📍 {dump.location}</span>
            </>
          )}
        </div>

        {showConfirm && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-red-400">Deleting in 3s…</span>
            <button
              onClick={handleUndo}
              className="text-[11px] text-[#8BAF7C] font-semibold hover:underline"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
