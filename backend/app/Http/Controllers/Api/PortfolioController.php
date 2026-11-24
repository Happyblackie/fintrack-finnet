<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PortfolioController extends Controller
{
    /**
     * List all portfolios belonging to the authenticated analyst.
     */
    public function index(Request $request): JsonResponse
    {
        $portfolios = $request->user()
            ->portfolios()
            ->withCount('transactions')
            ->latest()
            ->get();

        return response()->json([
            'data' => $portfolios,
        ]);
    }

    /**
     * Create a new client portfolio.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'base_currency' => ['required', Rule::in(['KES', 'USD'])],
        ]);

        $portfolio = $request->user()->portfolios()->create($validated);

        return response()->json([
            'message' => 'Portfolio created successfully.',
            'data' => $portfolio,
        ], 201);
    }

    /**
     * Retrieve a single portfolio by ID.
     */
    public function show(Request $request, Portfolio $portfolio): JsonResponse
    {
        $this->authorizeOwner($request, $portfolio);

        return response()->json([
            'data' => $portfolio->loadCount('transactions'),
        ]);
    }

    /**
     * Update an existing portfolio.
     */
    public function update(Request $request, Portfolio $portfolio): JsonResponse
    {
        $this->authorizeOwner($request, $portfolio);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'client_name' => ['sometimes', 'required', 'string', 'max:255'],
            'base_currency' => ['sometimes', 'required', Rule::in(['KES', 'USD'])],
        ]);

        $portfolio->update($validated);

        return response()->json([
            'message' => 'Portfolio updated successfully.',
            'data' => $portfolio,
        ]);
    }

    /**
     * Delete a portfolio and its cascading transactions.
     */
    public function destroy(Request $request, Portfolio $portfolio): JsonResponse
    {
        $this->authorizeOwner($request, $portfolio);

        $portfolio->delete();

        return response()->json([
            'message' => 'Portfolio deleted successfully.',
        ]);
    }

    /**
     * Ensure an analyst cannot read or modify another analyst's portfolio (IDOR protection).
     */
    private function authorizeOwner(Request $request, Portfolio $portfolio): void
    {
        if ($portfolio->user_id !== $request->user()->id) {
            abort(403, 'You do not have permission to access this portfolio.');
        }
    }
}