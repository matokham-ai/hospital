<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ProductionRolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $admin            = Role::firstOrCreate(['name' => 'Admin']);
        $hospitalAdmin    = Role::firstOrCreate(['name' => 'Hospital Administrator']);
        $doctor           = Role::firstOrCreate(['name' => 'Doctor']);
        $nurse            = Role::firstOrCreate(['name' => 'Nurse']);
        $pharmacist       = Role::firstOrCreate(['name' => 'Pharmacist']);
        $labtech          = Role::firstOrCreate(['name' => 'Lab Technician']);
        $radiologist      = Role::firstOrCreate(['name' => 'Radiologist']);
        $cashier          = Role::firstOrCreate(['name' => 'Cashier']);
        $receptionist     = Role::firstOrCreate(['name' => 'Receptionist']);

        // General permissions
        $generalPermissions = [
            'manage patients', 'manage appointments', 'record vitals',
            'prescribe drugs', 'dispense drugs', 'order labs',
            'release results', 'generate bills', 'approve payments',
        ];

        // Admin Master Data permissions - granular permissions for each entity
        $adminPermissions = [
            // Admin panel access
            'access admin panel',
            'view admin dashboard',
            
            // Department management
            'view departments',
            'create departments',
            'edit departments',
            'delete departments',
            'toggle department status',
            
            // Ward and bed management
            'view wards',
            'create wards',
            'edit wards',
            'delete wards',
            'view beds',
            'create beds',
            'edit beds',
            'delete beds',
            'update bed status',
            'view bed occupancy',
            
            // Test catalog management
            'view test catalogs',
            'create test catalogs',
            'edit test catalogs',
            'delete test catalogs',
            'update test pricing',
            'manage test categories',
            
            // Drug formulary management
            'view drug formulary',
            'create drug formulary',
            'edit drug formulary',
            'delete drug formulary',
            'update drug pricing',
            'manage drug stock',
            'view drug substitutes',
            
            // Master data operations
            'export master data',
            'import master data',
            'view audit logs',
            'bulk update master data',
        ];

        $allPermissions = array_merge($generalPermissions, $adminPermissions);

        foreach ($allPermissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Assign permissions
        $admin->givePermissionTo(Permission::all());
        
        // Hospital Administrator - full access to master data management
        $hospitalAdmin->givePermissionTo([
            'access admin panel',
            'view admin dashboard',
            'view departments', 'create departments', 'edit departments', 'delete departments', 'toggle department status',
            'view wards', 'create wards', 'edit wards', 'delete wards',
            'view beds', 'create beds', 'edit beds', 'delete beds', 'update bed status', 'view bed occupancy',
            'view test catalogs', 'create test catalogs', 'edit test catalogs', 'delete test catalogs', 'update test pricing', 'manage test categories',
            'view drug formulary', 'create drug formulary', 'edit drug formulary', 'delete drug formulary', 'update drug pricing', 'manage drug stock', 'view drug substitutes',
            'export master data', 'import master data', 'view audit logs', 'bulk update master data',
        ]);
        
        $doctor->givePermissionTo(['prescribe drugs', 'order labs']);
        $nurse->givePermissionTo(['record vitals']);
        $pharmacist->givePermissionTo(['dispense drugs', 'view drug formulary', 'view drug substitutes']);
        $labtech->givePermissionTo(['release results', 'view test catalogs']);
        $cashier->givePermissionTo(['generate bills', 'approve payments']);
        $receptionist->givePermissionTo(['manage appointments']);

        $this->command->info('Production roles and permissions created successfully.');
        $this->command->warn('No default users created. Create admin users manually using: php artisan admin:create-user');
    }
}