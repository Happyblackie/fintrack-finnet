<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained()->cascadeOnDelete();
            $table->string('instrument', 32);       // e.g. "SCOM", "KCB", "T-BILL-91"
            $table->enum('type', ['BUY', 'SELL']);
            $table->decimal('quantity', 16, 4);     // Supports fractional units safely
            $table->decimal('unit_price', 16, 4);   // Exact decimal arithmetic, never float!
            $table->date('trade_date');
            $table->timestamps();

            $table->index(['portfolio_id', 'instrument']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
