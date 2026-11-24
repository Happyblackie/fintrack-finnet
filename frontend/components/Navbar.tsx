"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, TrendingUp } from "lucide-react";
import { apiFetch, clearSession, getStoredUser } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const user = getStoredUser();
    if (user) setUserName(user.name);
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // Clear local session even if the server request fails
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  return (
    <header
      style={{ backgroundColor: "var(--color-navy-800)" }}
      className="text-white border-b border-slate-800 sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            style={{ backgroundColor: "var(--color-accent)" }}
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-none">
              FinTrack
            </span>
            <span className="text-[11px] text-slate-300 tracking-wide uppercase">
              by Finnet Technologies
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden sm:inline text-sm text-slate-300">
              Analyst: <strong className="text-white font-medium">{userName}</strong>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded-md border border-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}