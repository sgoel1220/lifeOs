"use client";

import { SWRConfig, State } from "swr";
import { ReactNode } from "react";

function localStorageProvider(): Map<string, State> {
  if (typeof window === "undefined") return new Map();
  const map = new Map<string, State>(
    JSON.parse(localStorage.getItem("lifeos-swr-cache") ?? "[]")
  );
  window.addEventListener("beforeunload", () => {
    localStorage.setItem(
      "lifeos-swr-cache",
      JSON.stringify(Array.from(map.entries()))
    );
  });
  return map;
}

export default function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        revalidateOnFocus: false,
        dedupingInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
