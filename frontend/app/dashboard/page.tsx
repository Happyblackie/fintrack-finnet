"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  Briefcase,
  AlertCircle,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { apiFetch, ApiError, getToken } from "@/lib/api";
import { Portfolio } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<"KES" | "USD">("KES");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadPortfolios();
  }, [router]);

  async function loadPortfolios() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Portfolio[] }>("/portfolios");
      setPortfolios(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load portfolios.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPortfolio(null);
    setName("");
    setClientName("");
    setBaseCurrency("KES");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(portfolio: Portfolio) {
    setEditingPortfolio(portfolio);
    setName(portfolio.name);
    setClientName(portfolio.client_name);
    setBaseCurrency(portfolio.base_currency);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSavePortfolio(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !clientName.trim()) {
      setFormError("Portfolio name and client name are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingPortfolio) {
        await apiFetch(`/portfolios/${editingPortfolio.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            client_name: clientName,
            base_currency: baseCurrency,
          }),
        });
      } else {
        await apiFetch("/portfolios", {
          method: "POST",
          body: JSON.stringify({
            name,
            client_name: clientName,
            base_currency: baseCurrency,
          }),
        });
      }
      setModalOpen(false);
      await loadPortfolios();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save portfolio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(portfolio: Portfolio) {
    const confirmed = window.confirm(
      `Delete "${portfolio.name}" for ${portfolio.client_name}? All associated transactions will be permanently removed.`
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/portfolios/${portfolio.id}`, { method: "DELETE" });
      setPortfolios((prev) => prev.filter((p) => p.id !== portfolio.id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete portfolio.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Portfolios</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage investment mandates, record trades, and monitor net holdings.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            style={{ backgroundColor: "var(--color-navy-800)" }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-95 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Portfolio</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadPortfolios}
              className="text-xs font-semibold underline hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4"
              >
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-9 bg-slate-100 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">No portfolios yet</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1 mb-6">
              Create your first client portfolio in KES or USD to begin recording buy and sell transactions.
            </p>
            <button
              onClick={openCreateModal}
              style={{ backgroundColor: "var(--color-navy-800)" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Portfolio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 tracking-wide">
                        {portfolio.base_currency}
                      </span>
                      <h2 className="mt-2.5 text-lg font-bold text-slate-900 leading-snug">
                        {portfolio.name}
                      </h2>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Client: <span className="font-medium text-slate-800">{portfolio.client_name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(portfolio)}
                        aria-label={`Edit ${portfolio.name}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(portfolio)}
                        aria-label={`Delete ${portfolio.name}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{portfolio.transactions_count ?? 0} recorded trades</span>
                    <span>
                      Created {new Date(portfolio.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/portfolios/${portfolio.id}`}
                  style={{ color: "var(--color-navy-800)" }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold transition"
                >
                  <span>Open Holdings &amp; Trades</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPortfolio ? "Edit Portfolio" : "Create New Portfolio"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePortfolio} className="space-y-4">
              <div>
                <label htmlFor="portfolio-name" className="block text-sm font-medium text-slate-700">
                  Portfolio Name
                </label>
                <input
                  id="portfolio-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NSE Blue-Chip & Treasury"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="client-name" className="block text-sm font-medium text-slate-700">
                  Client Name
                </label>
                <input
                  id="client-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. David Ochieng"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="base-currency" className="block text-sm font-medium text-slate-700">
                  Base Currency
                </label>
                <select
                  id="base-currency"
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value as "KES" | "USD")}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="KES">KES — Kenyan Shilling</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: "var(--color-navy-800)" }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving..." : editingPortfolio ? "Save Changes" : "Create Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}