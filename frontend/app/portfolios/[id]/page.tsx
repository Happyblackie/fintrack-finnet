"use client";

import { Suspense, useEffect, useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  AlertCircle,
  ArrowUpDown,
  Search,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Navbar from "@/components/Navbar";
import { apiFetch, ApiError, getToken } from "@/lib/api";
import { Portfolio, PortfolioSummary, Transaction } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatSignedCurrency,
} from "@/lib/format";

const CHART_COLORS = ["#0B1F3A", "#0D9488", "#2563EB", "#D97706", "#6366F1", "#475569"];

function PortfolioDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [instrument, setInstrument] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [tradeDate, setTradeDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [txError, setTxError] = useState<string | null>(null);
  const [submittingTx, setSubmittingTx] = useState(false);

  const [filterInstrument, setFilterInstrument] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [sortField, setSortField] = useState<"trade_date" | "instrument" | "total">("trade_date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadAllData(id);
  }, [id, router]);

  async function loadAllData(portfolioId: string) {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes, tRes] = await Promise.all([
        apiFetch<{ data: Portfolio }>(`/portfolios/${portfolioId}`),
        apiFetch<PortfolioSummary>(`/portfolios/${portfolioId}/summary`),
        apiFetch<{ data: Transaction[] }>(`/portfolios/${portfolioId}/transactions`),
      ]);
      setPortfolio(pRes.data);
      setSummary(sRes);
      setTransactions(tRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load portfolio data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(e: FormEvent) {
    e.preventDefault();
    setTxError(null);

    if (!instrument.trim() || Number(quantity) <= 0 || Number(unitPrice) <= 0 || !tradeDate) {
      setTxError("Please enter a valid instrument, positive quantity, positive price, and date.");
      return;
    }

    setSubmittingTx(true);
    try {
      await apiFetch(`/portfolios/${id}/transactions`, {
        method: "POST",
        body: JSON.stringify({
          instrument: instrument.trim().toUpperCase(),
          type,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          trade_date: tradeDate,
        }),
      });
      setInstrument("");
      setQuantity("");
      setUnitPrice("");
      if (id) await loadAllData(id);
    } catch (err) {
      setTxError(err instanceof ApiError ? err.message : "Failed to record transaction.");
    } finally {
      setSubmittingTx(false);
    }
  }

  async function handleDeleteTransaction(tx: Transaction) {
    const confirmed = window.confirm(
      `Delete ${tx.type} ${tx.quantity} ${tx.instrument} on ${tx.trade_date}?`
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/transactions/${tx.id}`, { method: "DELETE" });
      if (id) await loadAllData(id);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Cannot delete transaction.");
    }
  }

  const visibleTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesInstrument = tx.instrument
          .toLowerCase()
          .includes(filterInstrument.toLowerCase());
        const matchesType = filterType === "ALL" || tx.type === filterType;
        return matchesInstrument && matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "trade_date") {
          comparison = a.trade_date.localeCompare(b.trade_date);
        } else if (sortField === "instrument") {
          comparison = a.instrument.localeCompare(b.instrument);
        } else {
          comparison = a.quantity * a.unit_price - b.quantity * b.unit_price;
        }
        return sortAsc ? comparison : -comparison;
      });
  }, [transactions, filterInstrument, filterType, sortField, sortAsc]);

  function toggleSort(field: "trade_date" | "instrument" | "total") {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  const currency = portfolio?.base_currency ?? "KES";
  const pnl = summary?.totals.unrealized_pnl ?? 0;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portfolios</span>
      </Link>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading || !portfolio || !summary ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-28 bg-white rounded-xl border border-slate-200" />
            <div className="h-28 bg-white rounded-xl border border-slate-200" />
            <div className="h-28 bg-white rounded-xl border border-slate-200" />
          </div>
          <div className="h-72 bg-white rounded-xl border border-slate-200" />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">
                  {portfolio.name}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-200 text-slate-800">
                  {currency}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                Client: <strong className="text-slate-800">{portfolio.client_name}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Invested (Cost Basis)
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(summary.totals.total_invested, currency)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Portfolio Value
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(summary.totals.total_value, currency)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unrealized P&amp;L
              </p>
              <p
                className={`mt-2 text-2xl font-bold tabular-nums ${
                  pnl > 0
                    ? "text-green-700"
                    : pnl < 0
                    ? "text-red-700"
                    : "text-slate-900"
                }`}
              >
                {formatSignedCurrency(pnl, currency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  Current Holdings Summary
                </h2>
              </div>

              {summary.holdings.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No active holdings. Record a BUY transaction below to populate holdings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 text-left font-semibold">Instrument</th>
                        <th className="py-3 px-4 text-right font-semibold">Net Qty</th>
                        <th className="py-3 px-4 text-right font-semibold">Avg Cost</th>
                        <th className="py-3 px-4 text-right font-semibold">Total Invested</th>
                        <th className="py-3 px-4 text-right font-semibold">Total Value</th>
                        <th className="py-3 px-4 text-right font-semibold">Unrealized P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.holdings.map((h) => (
                        <tr key={h.instrument} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {h.instrument}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                            {formatNumber(h.net_quantity, 2)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                            {formatCurrency(h.average_cost, currency)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                            {formatCurrency(h.total_invested, currency)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">
                            {formatCurrency(h.total_value, currency)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right tabular-nums font-medium ${
                              h.unrealized_pnl > 0
                                ? "text-green-700"
                                : h.unrealized_pnl < 0
                                ? "text-red-700"
                                : "text-slate-600"
                            }`}
                          >
                            {formatSignedCurrency(h.unrealized_pnl, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h2 className="text-base font-bold text-slate-900 mb-2">
                Allocation by Value
              </h2>
              {summary.holdings.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500 text-center py-10">
                  Chart will display once holdings are recorded.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.holdings}
                        dataKey="total_value"
                        nameKey="instrument"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {summary.holdings.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(Number(value), currency)
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Record Trade Transaction
            </h2>

            {txError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{txError}</span>
              </div>
            )}

            <form
              onSubmit={handleAddTransaction}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
            >
              <div>
                <label htmlFor="tx-instrument" className="block text-xs font-semibold text-slate-700 uppercase">
                  Instrument
                </label>
                <input
                  id="tx-instrument"
                  type="text"
                  required
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="e.g. SCOM"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="tx-type" className="block text-xs font-semibold text-slate-700 uppercase">
                  Side
                </label>
                <select
                  id="tx-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "BUY" | "SELL")}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label htmlFor="tx-qty" className="block text-xs font-semibold text-slate-700 uppercase">
                  Quantity
                </label>
                <input
                  id="tx-qty"
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1000"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="tx-price" className="block text-xs font-semibold text-slate-700 uppercase">
                  Unit Price ({currency})
                </label>
                <input
                  id="tx-price"
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="18.50"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="tx-date" className="block text-xs font-semibold text-slate-700 uppercase">
                  Trade Date
                </label>
                <input
                  id="tx-date"
                  type="date"
                  required
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTx}
                style={{ backgroundColor: "var(--color-accent)" }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submittingTx ? "Saving..." : "Record Trade"}</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">
                Transaction Ledger ({visibleTransactions.length})
              </h2>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={filterInstrument}
                    onChange={(e) => setFilterInstrument(e.target.value)}
                    placeholder="Filter instrument..."
                    aria-label="Filter by instrument"
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "ALL" | "BUY" | "SELL")}
                  aria-label="Filter by transaction side"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="ALL">All Sides</option>
                  <option value="BUY">BUY Only</option>
                  <option value="SELL">SELL Only</option>
                </select>
              </div>
            </div>

            {visibleTransactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No matching transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button
                          type="button"
                          onClick={() => toggleSort("trade_date")}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                        >
                          <span>Trade Date</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button
                          type="button"
                          onClick={() => toggleSort("instrument")}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                        >
                          <span>Instrument</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Side</th>
                      <th className="py-3 px-4 text-right font-semibold">Quantity</th>
                      <th className="py-3 px-4 text-right font-semibold">Unit Price</th>
                      <th className="py-3 px-4 text-right font-semibold">
                        <button
                          type="button"
                          onClick={() => toggleSort("total")}
                          className="inline-flex items-center gap-1 ml-auto hover:text-slate-900 cursor-pointer"
                        >
                          <span>Total Value</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleTransactions.map((tx) => {
                      const rowTotal = tx.quantity * tx.unit_price;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            {tx.trade_date}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {tx.instrument}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                                tx.type === "BUY"
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                            {formatNumber(tx.quantity, 2)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                            {formatCurrency(tx.unit_price, currency)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">
                            {formatCurrency(rowTotal, currency)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteTransaction(tx)}
                              aria-label={`Delete transaction ${tx.id}`}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default function PortfolioDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-10 bg-slate-200 rounded w-1/3 animate-pulse mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
              <div className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
              <div className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
            </div>
          </div>
        }
      >
        <PortfolioDetailContent />
      </Suspense>
    </div>
  );
}