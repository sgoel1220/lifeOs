"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useItems, ProcessedItem } from "@/hooks/useItems";

function IdeaCard({ item, onArchive }: { item: ProcessedItem; onArchive: (id: string) => void }) {
  const metadata = item.metadata as Record<string, unknown> | null;
  const whyItMatters = typeof metadata?.whyItMatters === "string" ? metadata.whyItMatters : null;
  const nextSteps = Array.isArray(metadata?.nextSteps) ? (metadata.nextSteps as string[]) : [];

  return (
    <div className="flex flex-col bg-white rounded-xl border border-[#E8E0D5] shadow-sm hover:border-[#C4956A]/40 transition-all duration-150 overflow-hidden">
      <div className="p-4 flex-1">
        <h3 className="font-semibold text-[#2C2C2E] text-sm leading-snug mb-2">{item.title}</h3>
        {item.body && (
          <p className="text-xs text-[#8B7E6E] leading-relaxed line-clamp-3 mb-3">{item.body}</p>
        )}
        {whyItMatters && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-[#C4956A] uppercase tracking-wide mb-1">Why it matters</p>
            <p className="text-xs text-[#7A6E60] leading-relaxed line-clamp-2">{whyItMatters}</p>
          </div>
        )}
        {nextSteps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#8BAF7C] uppercase tracking-wide mb-1.5">Next Steps</p>
            <div className="flex flex-wrap gap-1.5">
              {nextSteps.slice(0, 3).map((step, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-[#8BAF7C]/10 text-[#4A7A3A] px-2 py-0.5 rounded-full leading-relaxed"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-2.5 border-t border-[#F0EBE0] flex items-center justify-between">
        {item.source ? (
          <p className="text-[11px] text-[#B0A090] italic truncate max-w-[80%]">
            {item.source.content.slice(0, 60)}{item.source.content.length > 60 ? "…" : ""}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={() => onArchive(item.id)}
          className="text-[11px] text-[#B0A090] hover:text-[#8B7E6E] transition-colors duration-150 flex-shrink-0 ml-2"
          aria-label="Archive idea"
        >
          Archive
        </button>
      </div>
    </div>
  );
}

export default function IdeasPageClient() {
  const { items, isLoading, isError, markArchived } = useItems("IDEA", "PENDING");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex-1 px-4 py-6 sm:px-6 md:p-8 max-w-5xl w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#2C2C2E]">Ideas</h1>
            <p className="text-sm text-[#8B7E6E] mt-1">
              {items.length > 0 ? `${items.length} ideas to explore` : "Ready for your next spark"}
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-[#F5F0E8] rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-500">Failed to load ideas. Please refresh.</p>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💡</p>
              <p className="text-[#8B7E6E] text-sm">No ideas captured yet — dump a thought and watch it grow</p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <IdeaCard key={item.id} item={item} onArchive={markArchived} />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
