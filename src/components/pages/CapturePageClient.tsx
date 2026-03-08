"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CaptureForm from "@/components/inkwell/CaptureForm";
import Logo from "@/components/ui/Logo";

function CaptureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillText = searchParams.get("text") ?? "";
  const [isOnline, setIsOnline] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Tap anywhere on the page → focus the textarea.
  // Critical for iOS PWA launched from home screen: autoFocus places the cursor
  // but iOS won't open the keyboard until a real user tap. Making the whole
  // background tappable means the first tap always opens the keyboard.
  const handlePageTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, textarea")) return;
    pageRef.current?.querySelector("textarea")?.focus();
  };

  return (
    <div
      ref={pageRef}
      onClick={handlePageTap}
      // min-h-dvh uses the dynamic viewport height (shrinks when keyboard opens)
      // so justify-center always centers within the visible area
      className="min-h-dvh flex flex-col items-center justify-center p-6"
      style={{
        background: "#FAF7F0",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
      }}
    >
      <div className="w-full max-w-lg mb-8 text-center pointer-events-none select-none">
        <div className="flex justify-center mb-1">
          <Logo size={40} showWordmark />
        </div>
        <p className="text-sm text-[#8BAF7C] italic font-serif">
          What&apos;s on your mind?
        </p>
        {!isOnline && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full pointer-events-auto">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            Offline — thought will sync when connected
          </div>
        )}
      </div>

      <div className="w-full max-w-lg">
        <CaptureForm
          autoFocus
          compact={false}
          initialContent={prefillText}
          showVoiceInput
        />
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-[#C4B8A8] hover:text-[#8BAF7C] transition-colors"
        >
          ← Back to Inkwell
        </button>
      </div>
    </div>
  );
}

export default function CapturePageClient() {
  return (
    <Suspense>
      <CaptureContent />
    </Suspense>
  );
}
