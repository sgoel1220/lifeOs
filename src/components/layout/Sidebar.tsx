"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { useItems } from "@/hooks/useItems";

const modules = [
  { name: "Inkwell", href: "/", icon: "🖋️", active: true },
  { name: "Tasks", href: "/tasks", icon: "✓", active: true, showBadge: true },
  { name: "Ideas", href: "/ideas", icon: "💡", active: true },
  { name: "Journal", href: "#", icon: "📖", active: false },
  { name: "Finance", href: "#", icon: "💰", active: false },
  { name: "Health", href: "#", icon: "🌿", active: false },
];

function TaskBadge() {
  const { total } = useItems("TASK", "PENDING");
  if (!total) return null;
  return (
    <span className="ml-auto text-[10px] bg-[#8BAF7C] text-white px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center">
      {total > 99 ? "99+" : total}
    </span>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <Logo size={28} showWordmark />
        <p className="text-xs text-[#8BAF7C] font-medium mt-1">Your second brain</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {modules.map((mod) => {
              const isActive = mod.active && pathname === mod.href;
              return (
                <SidebarMenuItem key={mod.name}>
                  {mod.active ? (
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={mod.href}>
                        <span>{mod.icon}</span>
                        <span>{mod.name}</span>
                        {mod.showBadge && <TaskBadge />}
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled className="opacity-50 cursor-not-allowed">
                      <span>{mod.icon}</span>
                      <span>{mod.name}</span>
                      <span className="ml-auto text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded-full">
                        soon
                      </span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={() => router.push("/capture")}
          className="w-full flex items-center justify-center gap-2 bg-[#8BAF7C] hover:bg-[#6B8F5C] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
        >
          <span>📱</span>
          <span>Quick Capture</span>
        </button>
        <p className="text-[11px] text-[#B0A090] text-center">
          Press{" "}
          <kbd className="bg-accent px-1.5 py-0.5 rounded text-[10px] font-mono">/</kbd>{" "}
          to capture
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
