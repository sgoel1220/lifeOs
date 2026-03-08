import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = "GET, POST, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";

  if (!origin.startsWith("chrome-extension://")) {
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": ALLOWED_METHODS,
        "Access-Control-Allow-Headers": ALLOWED_HEADERS,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export const config = {
  matcher: ["/api/inkwell/:path*", "/api/whoami"],
};
