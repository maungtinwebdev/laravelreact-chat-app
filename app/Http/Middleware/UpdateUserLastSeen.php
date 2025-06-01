<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UpdateUserLastSeen
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            if (Auth::check()) {
                $user = Auth::user();
                if ($user && $user->exists) {
                    $lastSeen = $user->last_seen_at;
                    
                    // Only update if more than 10 seconds have passed since last update
                    if (!$lastSeen || now()->diffInSeconds($lastSeen) >= 10) {
                        $user->update(['last_seen_at' => now()]);
                    }
                }
            }
        } catch (\Exception $e) {
            // Log the error but don't interrupt the request
            \Log::error('Error updating last seen: ' . $e->getMessage());
        }

        return $next($request);
    }
}
