<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UpdateUserLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();
            $lastSeen = $user->last_seen_at;
            
            // Only update if more than 10 seconds have passed since last update
            if (!$lastSeen || now()->diffInSeconds($lastSeen) >= 10) {
                $user->update(['last_seen_at' => now()]);
            }
        }

        return $next($request);
    }
}
