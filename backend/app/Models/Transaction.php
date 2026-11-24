<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'portfolio_id',
        'instrument',
        'type',
        'quantity',
        'unit_price',
        'trade_date',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'trade_date' => 'date:Y-m-d',
    ];

    public function portfolio()
    {
        return $this->belongsTo(Portfolio::class);
    }
}