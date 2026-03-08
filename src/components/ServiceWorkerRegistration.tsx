"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("[SW] Registration failed:", err));

    // When the service worker replays queued thoughts, tell SWR to revalidate
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        window.dispatchEvent(new CustomEvent("inkwell:synced"));
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
