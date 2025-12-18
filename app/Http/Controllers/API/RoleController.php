<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    /**
     * Get all available roles for login
     */
    public function index(): JsonResponse
    {
        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->name,
                'name' => $role->name,
                'description' => $this->getRoleDescription($role->name),
                'icon' => $this->getRoleIcon($role->name),
                'permissions_count' => $role->permissions()->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $roles,
            'message' => 'Roles retrieved successfully'
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
}