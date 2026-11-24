<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Demo Analyst Account (updateOrCreate makes seeding idempotent!)
        $analyst = User::updateOrCreate(
            ['email' => 'analyst@finnet.co.ke'],
            [
                'name' => 'Grace Mwangi',
                'password' => Hash::make('FinTrack2026!'),
            ]
        );

        // Clear existing demo portfolios if re-seeding
        $analyst->portfolios()->delete();

        // 2. KES Portfolio (Nairobi Securities Exchange & Treasury Bills)
        $kesPortfolio = $analyst->portfolios()->create([
            'name' => 'NSE Blue-Chip & Treasury',
            'client_name' => 'David Ochieng',
            'base_currency' => 'KES',
        ]);

        $kesPortfolio->transactions()->createMany([
            ['instrument' => 'SCOM', 'type' => 'BUY', 'quantity' => 10000, 'unit_price' => 16.50, 'trade_date' => '2026-09-10'],
            ['instrument' => 'SCOM', 'type' => 'BUY', 'quantity' => 5000,  'unit_price' => 18.00, 'trade_date' => '2026-10-05'],
            ['instrument' => 'SCOM', 'type' => 'SELL','quantity' => 3000,  'unit_price' => 19.25, 'trade_date' => '2026-11-12'],
            ['instrument' => 'KCB',  'type' => 'BUY', 'quantity' => 4000,  'unit_price' => 35.00, 'trade_date' => '2026-09-18'],
            ['instrument' => 'EQTY', 'type' => 'BUY', 'quantity' => 2500,  'unit_price' => 42.50, 'trade_date' => '2026-10-20'],
            ['instrument' => 'T-BILL-91', 'type' => 'BUY', 'quantity' => 500, 'unit_price' => 965.00, 'trade_date' => '2026-11-01'],
        ]);

        // 3. USD Portfolio (Global Tech & ETFs)
        $usdPortfolio = $analyst->portfolios()->create([
            'name' => 'Global Equities Core',
            'client_name' => 'Sarah Njoroge',
            'base_currency' => 'USD',
        ]);

        $usdPortfolio->transactions()->createMany([
            ['instrument' => 'MSFT', 'type' => 'BUY', 'quantity' => 25, 'unit_price' => 410.00, 'trade_date' => '2026-08-14'],
            ['instrument' => 'AAPL', 'type' => 'BUY', 'quantity' => 40, 'unit_price' => 220.00, 'trade_date' => '2026-09-22'],
            ['instrument' => 'AAPL', 'type' => 'SELL','quantity' => 10, 'unit_price' => 232.50, 'trade_date' => '2026-11-15'],
            ['instrument' => 'VOO',  'type' => 'BUY', 'quantity' => 15, 'unit_price' => 515.00, 'trade_date' => '2026-10-10'],
        ]);
    }
}