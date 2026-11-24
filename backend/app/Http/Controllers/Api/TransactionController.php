<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    /**
     * List all transactions for a portfolio, ordered newest first.
     */
    public function index(Request $request, Portfolio $portfolio): JsonResponse
    {
        $this->authorizeOwner($request, $portfolio);

        $transactions = $portfolio->transactions()
            ->orderByDesc('trade_date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $transactions,
        ]);
    }

    /**
     * Record a new BUY or SELL transaction against a portfolio.
     */
    public function store(Request $request, Portfolio $portfolio): JsonResponse
    {
        $this->authorizeOwner($request, $portfolio);

        $validated = $request->validate([
            'instrument' => ['required', 'string', 'max:32'],
            'type' => ['required', Rule::in(['BUY', 'SELL'])],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_price' => ['required', 'numeric', 'gt:0'],
            'trade_date' => ['required', 'date'],
        ]);

        // Normalize ticker symbol to uppercase (e.g. "scom" -> "SCOM")
        $instrument = strtoupper(trim($validated['instrument']));

        // Business Rule: Cannot sell more units than currently held in this portfolio
        if ($validated['type'] === 'SELL') {
            $currentHeld = $this->getHeldQuantity($portfolio, $instrument);

            if ((float) $validated['quantity'] > $currentHeld) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        "Insufficient holdings for {$instrument}. Available quantity: {$currentHeld}.",
                    ],
                ]);
            }
        }

        $transaction = $portfolio->transactions()->create([
            'instrument' => $instrument,
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'unit_price' => $validated['unit_price'],
            'trade_date' => $validated['trade_date'],
        ]);

        return response()->json([
            'message' => 'Transaction recorded successfully.',
            'data' => $transaction,
        ], 201);
    }

    /**
     * Delete a transaction by ID.
     */
    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorizeOwner($request, $transaction->portfolio);

        // Safety check: deleting a BUY shouldn't leave total sells exceeding total buys
        if ($transaction->type === 'BUY') {
            $remainingHeldAfterDelete = $this->getHeldQuantity($transaction->portfolio, $transaction->instrument) - (float) $transaction->quantity;
            if ($remainingHeldAfterDelete < 0) {
                throw ValidationException::withMessages([
                    'transaction' => [
                        "Cannot delete this BUY transaction because subsequent SELL orders depend on these units.",
                    ],
                ]);
            }
        }

        $transaction->delete();

        return response()->json([
            'message' => 'Transaction deleted successfully.',
        ]);
    }

    /**
     * Calculate per-instrument net quantity, average cost, total invested, and total value.
     */
    public function summary(Request $request, Portfolio $portfolio): JsonResponse
    {
        $this->authorizeOwner($request, $portfolio);

        // Fetch chronologically so the last processed transaction gives the latest trade price
        $transactions = $portfolio->transactions()
            ->orderBy('trade_date')
            ->orderBy('id')
            ->get();

        $grouped = $transactions->groupBy('instrument');
        $holdings = [];

        foreach ($grouped as $instrument => $txList) {
            $totalBoughtQty = 0.0;
            $totalBoughtCost = 0.0;
            $totalSoldQty = 0.0;
            $latestPrice = 0.0;

            foreach ($txList as $tx) {
                $qty = (float) $tx->quantity;
                $price = (float) $tx->unit_price;
                $latestPrice = $price; // Tracks most recent trade price as current market price

                if ($tx->type === 'BUY') {
                    $totalBoughtQty += $qty;
                    $totalBoughtCost += ($qty * $price);
                } else {
                    $totalSoldQty += $qty;
                }
            }

            $netQuantity = round($totalBoughtQty - $totalSoldQty, 4);

            // Skip instruments that have been completely sold off (0 net units)
            if ($netQuantity <= 0) {
                continue;
            }

            // Weighted Average Cost (WAC) across all BUY trades
            $averageCost = $totalBoughtQty > 0 ? ($totalBoughtCost / $totalBoughtQty) : 0.0;
            $totalInvested = $netQuantity * $averageCost;
            $totalValue = $netQuantity * $latestPrice;
            $unrealizedPnl = $totalValue - $totalInvested;

            $holdings[] = [
                'instrument' => $instrument,
                'net_quantity' => round($netQuantity, 4),
                'average_cost' => round($averageCost, 2),
                'latest_price' => round($latestPrice, 2),
                'total_invested' => round($totalInvested, 2),
                'total_value' => round($totalValue, 2),
                'unrealized_pnl' => round($unrealizedPnl, 2),
            ];
        }

        $portfolioTotalInvested = round(array_sum(array_column($holdings, 'total_invested')), 2);
        $portfolioTotalValue = round(array_sum(array_column($holdings, 'total_value')), 2);
        $portfolioPnl = round($portfolioTotalValue - $portfolioTotalInvested, 2);

        return response()->json([
            'portfolio_id' => $portfolio->id,
            'base_currency' => $portfolio->base_currency,
            'totals' => [
                'total_invested' => $portfolioTotalInvested,
                'total_value' => $portfolioTotalValue,
                'unrealized_pnl' => $portfolioPnl,
            ],
            'holdings' => array_values($holdings),
        ]);
    }

    /**
     * Helper to calculate net held units for a specific instrument in a portfolio.
     */
    private function getHeldQuantity(Portfolio $portfolio, string $instrument): float
    {
        $bought = (float) $portfolio->transactions()
            ->where('instrument', $instrument)
            ->where('type', 'BUY')
            ->sum('quantity');

        $sold = (float) $portfolio->transactions()
            ->where('instrument', $instrument)
            ->where('type', 'SELL')
            ->sum('quantity');

        return round($bought - $sold, 4);
    }

    private function authorizeOwner(Request $request, Portfolio $portfolio): void
    {
        if ($portfolio->user_id !== $request->user()->id) {
            abort(403, 'You do not have permission to access this portfolio.');
        }
    }
}