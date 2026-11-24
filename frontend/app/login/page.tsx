"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, AlertCircle } from "lucide-react";
import { apiFetch, ApiError, setSession } from "@/lib/api";
import { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fillDemoCredentials() {
    setEmail("analyst@finnet.co.ke");
    setPassword("FinTrack2026!");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(res.token, res.user);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to reach the FinTrack API. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          style={{ backgroundColor: "var(--color-navy-800)" }}
          className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
        >
          <TrendingUp
            style={{ color: "var(--color-accent)" }}
            className="w-7 h-7"
          />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          FinTrack by Finnet Technologies
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Investment Operations Portfolio &amp; Transactions Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-10">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Analyst Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@finnet.co.ke"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "var(--color-navy-800)" }}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in to FinTrack"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-3 text-center">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 underline cursor-pointer"
            >
              Use Demo Analyst Account (analyst@finnet.co.ke)
            </button>
            <p className="text-sm text-slate-600">
              New analyst?{" "}
              <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}