<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Analyst Routes (Requires Bearer Token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Request $request) => response()->json(['user' => $request->user()]));

    // Portfolios CRUD
    Route::apiResource('portfolios', PortfolioController::class);

    // Transactions & Holdings Summary
    Route::get('/portfolios/{portfolio}/transactions', [TransactionController::class, 'index']);
    Route::post('/portfolios/{portfolio}/transactions', [TransactionController::class, 'store']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
    Route::get('/portfolios/{portfolio}/summary', [TransactionController::class, 'summary']);
});