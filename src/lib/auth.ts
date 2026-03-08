import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

function normalizeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

const baseURL = normalizeUrl(
  process.env.BETTER_AUTH_URL ??
    process.env.RAILWAY_STATIC_URL ??
    process.env.RAILWAY_PUBLIC_DOMAIN
);

const secret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET;

// In production, allow the Chrome extension to send the session cookie
// cross-origin by setting SameSite=None; Secure.
const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  ...(isProd && {
    advanced: {
      cookies: {
        sessionToken: {
          attributes: { sameSite: "none" as const, secure: true },
        },
      },
    },
  }),
});
