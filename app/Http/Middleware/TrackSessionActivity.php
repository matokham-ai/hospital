<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackSessionActivity
{
    /**
     * Handle an incoming request and track session activity.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Update last activity timestamp for authenticated users
        if ($request->user()) {
            $request->session()->put('last_activity', now()->timestamp);
            
            // Store user info for concurrent access tracking
            $request->session()->put('user_agent', $request->userAgent());
            $request->session()->put('ip_address', $request->ip());
        }

        return $next($request);
    }
}
