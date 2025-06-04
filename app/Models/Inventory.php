<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'quantity',
        'price',
        'description',
        'minimum_stock',
        'user_id'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'minimum_stock' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
