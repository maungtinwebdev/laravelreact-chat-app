<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Day extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'media_url',
        'caption',
        'media_type',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired()
    {
        return now()->isAfter($this->expires_at);
    }

    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }
} 