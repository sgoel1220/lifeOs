import { NextRequest, NextResponse } from "next/server";

// Android share target — registered in /manifest.json
// When user shares text/URL from any app, Android sends a GET here
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") ?? "";
  const title = searchParams.get("title") ?? "";
  const url = searchParams.get("url") ?? "";

  // Combine shared content into one string
  const parts = [text, url].filter(Boolean);
  const combined = parts.length > 0 ? parts.join("\n") : title;

  const captureUrl = new URL("/capture", request.url);
  if (combined) {
    captureUrl.searchParams.set("text", combined);
  }

  return NextResponse.redirect(captureUrl);
}
