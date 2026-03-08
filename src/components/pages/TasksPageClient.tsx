"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useItems, ProcessedItem } from "@/hooks/useItems";

function getPriorityDot(priority: string | null) {
  if (priority === "HIGH") return "bg-red-500";
  if (priority === "MEDIUM") return "bg-amber-400";
  return "bg-gray-300";
}

function getDueDateLabel(dueDate: string | null): { label: string; color: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: "bg-red-100 text-red-700" };
  if (diffDays === 0) return { label: "Today", color: "bg-amber-100 text-amber-700" };
  if (diffDays === 1) return { label: "Tomorrow", color: "bg-blue-100 text-blue-700" };
  if (diffDays <= 7) return { label: `${diffDays}d`, color: "bg-sage/10 text-sage" };
  return { label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: "bg-gray-100 text-gray-600" };
}

function groupTasks(items: ProcessedItem[]): {
  overdue: ProcessedItem[];
  today: ProcessedItem[];
  thisWeek: ProcessedItem[];
  later: ProcessedItem[];
} {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const overdue: ProcessedItem[] = [];
  const today: ProcessedItem[] = [];
  const thisWeek: ProcessedItem[] = [];
  const later: ProcessedItem[] = [];

  for (const item of items) {
    if (!item.dueDate) {
      later.push(item);
      continue;
    }
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due < now) overdue.push(item);
    else if (due.getTime() === now.getTime()) today.push(item);
    else if (due <= weekEnd) thisWeek.push(item);
    else later.push(item);
  }

  return { overdue, today, thisWeek, later };
}

function TaskCard({ item, onDone }: { item: ProcessedItem; onDone: (id: string) => void }) {
  const dateLabel = getDueDateLabel(item.dueDate);
  const metadata = item.metadata as Record<string, unknown> | null;
  const steps = Array.isArray(metadata?.steps) ? (metadata.steps as string[]) : [];

  return (
    <div className="group flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E8E0D5] hover:border-[#8BAF7C]/40 transition-all duration-150 shadow-sm">
      <button
        onClick={() => onDone(item.id)}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#8BAF7C] hover:bg-[#8BAF7C]/20 transition-colors duration-150"
        aria-label="Mark done"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span className="font-medium text-[#2C2C2E] text-sm leading-snug">{item.title}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {item.priority && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDot(item.priority)}`} title={item.priority} />
            )}
            {dateLabel && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${dateLabel.color}`}>
                {dateLabel.label}
              </span>
            )}
          </div>
        </div>
        {item.body && (
          <p className="mt-1 text-xs text-[#8B7E6E] leading-relaxed line-clamp-2">{item.body}</p>
        )}
        {steps.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {steps.slice(0, 3).map((step, i) => (
              <li key={i} className="text-[11px] text-[#A09080] flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C4956A] flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        )}
        {item.source && (
          <p className="mt-2 text-[11px] text-[#B0A090] italic line-clamp-1">
            From: {item.source.content.slice(0, 80)}{item.source.content.length > 80 ? "…" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  onDone,
  tint,
}: {
  title: string;
  items: ProcessedItem[];
  onDone: (id: string) => void;
  tint?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`mb-6 ${tint ?? ""}`}>
      <h2 className="text-xs font-semibold text-[#8B7E6E] uppercase tracking-wider mb-2 px-1">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <TaskCard key={item.id} item={item} onDone={onDone} />
        ))}
      </div>
    </div>
  );
}

export default function TasksPageClient() {
  const { items, isLoading, isError, markDone } = useItems("TASK", "PENDING");
  const { overdue, today, thisWeek, later } = groupTasks(items);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex-1 px-4 py-6 sm:px-6 md:p-8 max-w-3xl w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#2C2C2E]">Tasks</h1>
            <p className="text-sm text-[#8B7E6E] mt-1">
              {items.length > 0 ? `${items.length} pending` : "All clear"}
            </p>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#F5F0E8] rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-500">Failed to load tasks. Please refresh.</p>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">✓</p>
              <p className="text-[#8B7E6E] text-sm">No tasks yet — dump something that needs doing</p>
            </div>
          )}

          {!isLoading && (
            <>
              <Section title="Overdue" items={overdue} onDone={markDone} />
              <Section title="Today" items={today} onDone={markDone} />
              <Section title="This Week" items={thisWeek} onDone={markDone} />
              <Section title="Later" items={later} onDone={markDone} />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
