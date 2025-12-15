<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Update session activity timestamp for concurrent access tracking
        if ($user) {
            $request->session()->put('last_activity', now()->timestamp);
        }

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user ? [
                    'id'     => $user->id,
                    'name'   => $user->name,
                    'email'  => $user->email,
                    'status' => $user->status,
                    'role'   => $user->getRoleNames()->first(),
                    // ❌ Removed 'physician' section completely
                ] : null,
            ],

            'permissions' => $user
                ? $user->getAllPermissions()->pluck('name')->toArray()
                : [],

            'csrf_token' => csrf_token(),
            
            'session_expires_at' => fn () => $request->session()->get('last_activity') 
                ? now()->timestamp + (config('session.lifetime') * 60)
                : null,

            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error'   => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
            ],

            'branches' => fn () => \App\Models\Branch::active()
                ->orderBy('is_main_branch', 'desc')
                ->orderBy('branch_name')
                ->get(['id', 'branch_code', 'branch_name', 'location', 'status']),

            'selectedBranch' => fn () => $request->session()->get('selected_branch_id'),
        ];
    }


}
