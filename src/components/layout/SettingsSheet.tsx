"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AI_MODELS, useSettings } from "@/hooks/useSettings";

function UnprocessedCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/inkwell/process-all")
      .then((r) => r.json())
      .then((d) => setCount(d.unprocessed ?? 0))
      .catch(() => {});
  }, []);

  if (count === null) return null;
  if (count === 0)
    return (
      <p className="text-xs text-[#8BAF7C]">All thoughts are processed ✓</p>
    );
  return (
    <p className="text-xs text-[#C4956A] font-medium">
      {count} unprocessed thought{count !== 1 ? "s" : ""}
    </p>
  );
}

interface ProcessResult {
  total: number;
  processed: number;
  failed: number;
}

export default function SettingsSheet() {
  const { model, setModel, hydrated } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleProcessAll = async () => {
    setIsProcessing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/inkwell/process-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      if (!res.ok) throw new Error("Failed");
      const data: ProcessResult = await res.json();
      setResult(data);
    } catch {
      setError("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          title="Settings"
          className="w-full flex items-center gap-2 text-[#8B7E6E] hover:text-[#2C2C2E] text-xs px-2 py-1.5 rounded-lg hover:bg-[#F0EBE0] transition-colors"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 bg-[#FAF7F0] border-r border-[#E8DDD0]">
        <SheetHeader className="border-b border-[#E8DDD0] pb-4 mb-6">
          <SheetTitle className="text-[#2C2C2E] font-serif text-lg">Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* AI Model Selection */}
          <section>
            <h3 className="text-xs font-semibold text-[#8B7E6E] uppercase tracking-wider mb-3">
              AI Model
            </h3>
            <div className="space-y-2">
              {AI_MODELS.map((m) => {
                const isSelected = hydrated && model === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? "bg-[#8BAF7C]/10 border-[#8BAF7C] text-[#2C2C2E]"
                        : "bg-white border-[#E8DDD0] text-[#4A3F30] hover:border-[#C4956A]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium">{m.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          m.badge === "cheap"
                            ? "bg-[#8BAF7C]/20 text-[#4A7A3A]"
                            : "bg-[#C4956A]/20 text-[#8B5E3C]"
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#8B7E6E]">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Process All */}
          <section>
            <h3 className="text-xs font-semibold text-[#8B7E6E] uppercase tracking-wider mb-3">
              Processing
            </h3>
            <div className="bg-white border border-[#E8DDD0] rounded-xl p-4 space-y-3">
              <UnprocessedCount />
              <p className="text-xs text-[#8B7E6E]">
                Run AI processing on all thoughts that haven&apos;t been
                processed yet. Uses the selected model above.
              </p>
              <button
                onClick={handleProcessAll}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-[#8BAF7C] hover:bg-[#6B8F5C] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-150"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Process All Thoughts</span>
                  </>
                )}
              </button>

              {result && (
                <div
                  className={`text-xs rounded-lg px-3 py-2 ${
                    result.failed > 0
                      ? "bg-[#C4956A]/10 text-[#8B5E3C]"
                      : "bg-[#8BAF7C]/10 text-[#4A7A3A]"
                  }`}
                >
                  {result.total === 0 ? (
                    "Nothing to process — all thoughts are already processed."
                  ) : (
                    <>
                      Processed {result.processed} of {result.total} thought
                      {result.total !== 1 ? "s" : ""}
                      {result.failed > 0 && ` (${result.failed} failed)`}
                    </>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
