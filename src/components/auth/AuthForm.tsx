"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Logo from "@/components/ui/Logo";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";
  const submitLabel = useMemo(
    () => (isSignUp ? "Create account" : "Sign in"),
    [isSignUp]
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (result.error) {
          setError(result.error.message ?? "Could not create account");
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });

        if (result.error) {
          setError(result.error.message ?? "Invalid credentials");
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#FAF7F0" }}
    >
      <div className="w-full max-w-md bg-[#FFFDF8] border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Logo size={36} showWordmark />
          </div>
          <p className="text-sm text-[#8BAF7C] italic font-serif">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm text-[#6B5E4A] mb-1.5">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#8BAF7C]"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-[#6B5E4A] mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#8BAF7C]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[#6B5E4A] mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#E8DDD0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#8BAF7C]"
              placeholder="Minimum 8 characters"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#8BAF7C] hover:bg-[#6B8F5C] disabled:bg-[#C4D8BA] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-150 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : submitLabel}
          </button>
        </form>

        <p className="text-sm text-[#B0A090] mt-5 text-center">
          {isSignUp ? "Already have an account?" : "New to LifeOS?"}{" "}
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="text-[#8BAF7C] hover:text-[#6B8F5C] font-medium"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  );
}
