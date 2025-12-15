<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ServiceCategoryPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'view service categories',
            'create service categories', 
            'edit service categories',
            'delete service categories',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to roles
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
        }

        // Create accountant role if it doesn't exist and assign permissions
        $accountantRole = Role::firstOrCreate(['name' => 'accountant']);
        $accountantRole->givePermissionTo([
            'view service categories',
            'create service categories', 
            'edit service categories',
        ]);

        // Also give billing permissions to accountant
        $billingPermissions = [
            'generate bills',
            'approve payments',
        ];

        foreach ($billingPermissions as $permission) {
            $perm = Permission::where('name', $permission)->first();
            if ($perm) {
                $accountantRole->givePermissionTo($perm);
            }
        }

        echo "Service category permissions created and assigned successfully.\n";
    }
}