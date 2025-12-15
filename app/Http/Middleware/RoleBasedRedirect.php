<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleBasedRedirect
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $selectedRole = session('user_selected_role');
            
            // If user doesn't have the selected role, redirect to appropriate dashboard
            if ($selectedRole && !$user->hasRole($selectedRole)) {
                // Get user's primary role (first role)
                $primaryRole = $user->roles->first();
                if ($primaryRole) {
                    session(['user_selected_role' => $primaryRole->name]);
                    return redirect()->route($this->getRoleRoute($primaryRole->name));
                }
            }
        }

        return $next($request);
    }

    /**
     * Get the appropriate route for a role
     */
    private function getRoleRoute(string $role): string
    {
        $roleRoutes = [
            'Admin' => 'admin.dashboard',
            'Hospital Administrator' => 'admin.dashboard',
            'Doctor' => 'doctor.dashboard',
            'Nurse' => 'nurse.dashboard',
            'Pharmacist' => 'pharmacist.dashboard',
            'Lab Technician' => 'dashboard',
            'Radiologist' => 'dashboard',
            'Cashier' => 'billing.dashboard',
            'Receptionist' => 'receptionist.dashboard',
        ];

        return $roleRoutes[$role] ?? 'dashboard';
    }
}