<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check() || !auth()->user()->is_admin) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unauthorized action.'], 403);
            }
            return redirect()->route('dashboard')->with('error', 'Unauthorized action.');
        }

        return $next($request);
    }
}
