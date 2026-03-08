"use client";

import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <header className="px-4 md:px-8 py-4 md:py-5 border-b border-[#E8DDD0] bg-[#FAF7F0]/80 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-3">
      {/* Hamburger — visible on mobile, hidden on md+ (sidebar always visible there) */}
      <SidebarTrigger className="text-[#8BAF7C] hover:text-[#6B8F5C] hover:bg-[#F0EBE0] -ml-1 md:hidden" />

      <div className="flex items-center justify-between flex-1 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl font-serif font-bold text-[#2C2C2E] flex items-center gap-2">
            🖋️ Inkwell
          </h1>
          <p className="text-sm text-[#8BAF7C] mt-0.5 italic hidden sm:block">
            &ldquo;Capture thoughts before they fly away&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#B0A090] shrink-0 ml-3">
          <span className="w-2 h-2 rounded-full bg-[#8BAF7C] animate-pulse inline-block" />
          <span className="hidden lg:inline max-w-40 truncate">
            {session?.user.email ?? "Guest"}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs border border-[#E8DDD0] rounded-lg px-2 py-1 hover:bg-[#F0EBE0] transition-colors"
          >
            Sign out
          </button>
          <span className="hidden sm:inline">Pune · </span>
          {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>
    </header>
  );
}
