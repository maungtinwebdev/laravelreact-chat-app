<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get the expenses for the category.
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'category');
    }
}
