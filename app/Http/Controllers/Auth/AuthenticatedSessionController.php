<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        // Get all available roles with their descriptions
        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->name,
                'name' => $role->name,
                'description' => $this->getRoleDescription($role->name),
                'icon' => $this->getRoleIcon($role->name),
            ];
        });

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'roles' => $roles,
        ]);
    }

    /**
     * Get role description for display
     */
    private function getRoleDescription(string $roleName): string
    {
        $descriptions = [
            'Admin' => 'System management & oversight',
            'Hospital Administrator' => 'Hospital operations & master data',
            'Doctor' => 'Clinical consultation & prescription',
            'Nurse' => 'Patient care & vitals monitoring',
            'Lab Technician' => 'Sample processing & results',
            'Pharmacist' => 'Medication dispensing & inventory',
            'Receptionist' => 'Patient registration & scheduling',
            'Cashier' => 'Billing & payment processing',
            'Radiologist' => 'Medical imaging & reports',
        ];

        return $descriptions[$roleName] ?? 'Healthcare professional';
    }

    /**
     * Get role icon for display
     */
    private function getRoleIcon(string $roleName): string
    {
        $icons = [
            'Admin' => '⚙️',
            'Hospital Administrator' => '🏥',
            'Doctor' => '👨‍⚕️',
            'Nurse' => '👩‍⚕️',
            'Lab Technician' => '🔬',
            'Pharmacist' => '💊',
            'Receptionist' => '📋',
            'Cashier' => '💰',
            'Radiologist' => '🩻',
        ];

        return $icons[$roleName] ?? '👤';
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Store the selected role in session for role-based redirects
        $user = Auth::user();
        $selectedRole = $request->input('role');
        
        session(['user_selected_role' => $selectedRole]);

        // Redirect based on role
        return $this->redirectBasedOnRole($selectedRole);
    }

    /**
     * Redirect user based on their selected role
     */
    private function redirectBasedOnRole(string $role): RedirectResponse
    {
        $roleRoutes = [
            'Admin' => 'admin.dashboard',
            'Hospital Administrator' => 'admin.dashboard',
            'Doctor' => 'doctor.dashboard',
            'Nurse' => 'nurse.dashboard',
            'Pharmacist' => 'pharmacy.dashboard',
            'Lab Technician' => 'dashboard',
            'Radiologist' => 'dashboard',
            'Cashier' => 'billing.dashboard',
            'Receptionist' => 'receptionist.dashboard',
        ];

        $route = $roleRoutes[$role] ?? 'dashboard';
        
        return redirect()->intended(route($route, absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
