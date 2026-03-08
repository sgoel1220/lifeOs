import type { Metadata, Viewport } from "next";
import "./globals.css";
import SWRProvider from "@/components/SWRProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8BAF7C",
};

export const metadata: Metadata = {
  title: "LifeOS — Inkwell",
  description: "Speed-first brain dump capture. Capture thoughts before they fly away.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inkwell",
  },
  icons: {
    apple: "/icons/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "#FAF7F0" }}>
        <SWRProvider>
          {children}
          <ServiceWorkerRegistration />
        </SWRProvider>
      </body>
    </html>
  );
}
