"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CaptureForm from "@/components/inkwell/CaptureForm";
import DumpList from "@/components/inkwell/DumpList";
import { useItems } from "@/hooks/useItems";

function TodaysFocus() {
  const { items, isLoading } = useItems("TASK", "PENDING");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = items.filter((item) => {
    if (!item.dueDate) return false;
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  });

  if (isLoading || todayTasks.length === 0) return null;

  return (
    <div className="mb-6 bg-[#FAF7F0] border border-[#E8E0D5] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#2C2C2E]">
          Today&apos;s Focus
          <span className="ml-2 text-[11px] font-normal text-[#8B7E6E]">
            {todayTasks.length} task{todayTasks.length > 1 ? "s" : ""} due today
          </span>
        </h2>
        <Link href="/tasks" className="text-[11px] text-[#8BAF7C] hover:text-[#6B8F5C] font-medium transition-colors">
          View all →
        </Link>
      </div>
      <ul className="space-y-1.5">
        {todayTasks.slice(0, 3).map((task) => (
          <li key={task.id} className="flex items-center gap-2 text-xs text-[#4A3F30]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8BAF7C] flex-shrink-0" />
            <span className="line-clamp-1">{task.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPageClient() {
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "textarea" || tag === "input") return;
      if (e.key === "/") {
        e.preventDefault();
        captureRef.current?.querySelector("textarea")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex-1 px-4 py-6 sm:px-6 md:p-8 max-w-3xl w-full mx-auto">
          <TodaysFocus />
          <div ref={captureRef} className="mb-6 md:mb-8">
            <CaptureForm autoFocus />
          </div>
          <DumpList />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
