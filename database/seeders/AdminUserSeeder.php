<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates specialized admin users for the master data system
     * with different permission levels for testing and demonstration purposes.
     */
    public function run(): void
    {
        $this->command->info('Creating specialized admin users for master data system...');

        // Create specialized admin roles if they don't exist
        $this->createSpecializedRoles();

        // Create admin users with different permission levels
        $adminUsers = [
            [
                'name' => 'Master Data Administrator',
                'email' => 'masterdata@hospital.com',
                'password' => 'MasterData@2024',
                'role' => 'Master Data Admin',
                'permissions' => [
                    'access admin panel', 'view admin dashboard',
                    'view departments', 'create departments', 'edit departments', 'delete departments', 'toggle department status',
                    'view wards', 'create wards', 'edit wards', 'delete wards',
                    'view beds', 'create beds', 'edit beds', 'delete beds', 'update bed status', 'view bed occupancy',
                    'view test catalogs', 'create test catalogs', 'edit test catalogs', 'delete test catalogs', 'update test pricing', 'manage test categories',
                    'view drug formulary', 'create drug formulary', 'edit drug formulary', 'delete drug formulary', 'update drug pricing', 'manage drug stock', 'view drug substitutes',
                    'export master data', 'import master data', 'view audit logs', 'bulk update master data',
                ]
            ],
            [
                'name' => 'Department Manager',
                'email' => 'dept.manager@hospital.com',
                'password' => 'DeptManager@2024',
                'role' => 'Department Manager',
                'permissions' => [
                    'access admin panel', 'view admin dashboard',
                    'view departments', 'create departments', 'edit departments', 'toggle department status',
                    'view wards', 'create wards', 'edit wards',
                    'view beds', 'create beds', 'edit beds', 'update bed status', 'view bed occupancy',
                    'export master data', 'view audit logs',
                ]
            ],
            [
                'name' => 'Pharmacy Manager',
                'email' => 'pharmacy.manager@hospital.com',
                'password' => 'PharmacyMgr@2024',
                'role' => 'Pharmacy Manager',
                'permissions' => [
                    'access admin panel', 'view admin dashboard',
                    'view drug formulary', 'create drug formulary', 'edit drug formulary', 'delete drug formulary', 
                    'update drug pricing', 'manage drug stock', 'view drug substitutes',
                    'export master data', 'import master data', 'view audit logs',
                ]
            ],
            [
                'name' => 'Laboratory Manager',
                'email' => 'lab.manager@hospital.com',
                'password' => 'LabManager@2024',
                'role' => 'Laboratory Manager',
                'permissions' => [
                    'access admin panel', 'view admin dashboard',
                    'view test catalogs', 'create test catalogs', 'edit test catalogs', 'delete test catalogs', 
                    'update test pricing', 'manage test categories',
                    'export master data', 'import master data', 'view audit logs',
                ]
            ],
            [
                'name' => 'Read-Only Admin',
                'email' => 'readonly.admin@hospital.com',
                'password' => 'ReadOnly@2024',
                'role' => 'Read-Only Admin',
                'permissions' => [
                    'access admin panel', 'view admin dashboard',
                    'view departments', 'view wards', 'view beds', 'view bed occupancy',
                    'view test catalogs', 'view drug formulary', 'view drug substitutes',
                    'view audit logs',
                ]
            ],
            [
                'name' => 'Data Entry Specialist',
                'email' => 'dataentry@hospital.com',
                'password' => 'DataEntry@2024',
                'role' => 'Data Entry Specialist',
                'permissions' => [
                    'access admin panel', 'view admin dashboard',
                    'view departments', 'create departments', 'edit departments',
                    'view wards', 'create wards', 'edit wards',
                    'view beds', 'create beds', 'edit beds', 'update bed status',
                    'view test catalogs', 'create test catalogs', 'edit test catalogs',
                    'view drug formulary', 'create drug formulary', 'edit drug formulary',
                    'import master data', 'view audit logs',
                ]
            ],
        ];

        // Create demo users for testing
        $demoUsers = [
            [
                'name' => 'Demo Admin',
                'email' => 'demo@hospital.com',
                'password' => 'Demo@123',
                'role' => 'Admin',
                'permissions' => [] // Will get all permissions from Admin role
            ],
            [
                'name' => 'Test User',
                'email' => 'test@hospital.com',
                'password' => 'Test@123',
                'role' => 'Master Data Admin',
                'permissions' => []
            ],
        ];

        // Create all users
        $allUsers = array_merge($adminUsers, $demoUsers);
        
        foreach ($allUsers as $userData) {
            $this->createAdminUser($userData);
        }

        $this->command->info('');
        $this->command->info('✅ Created ' . count($allUsers) . ' specialized admin users!');
        $this->command->info('');
        $this->command->info('🔐 Admin Login Credentials:');
        $this->command->info('==========================');
        
        foreach ($allUsers as $user) {
            $this->command->info("👤 {$user['name']}");
            $this->command->info("   📧 Email: {$user['email']}");
            $this->command->info("   🔑 Password: {$user['password']}");
            $this->command->info("   👥 Role: {$user['role']}");
            $this->command->info('');
        }
        
        $this->command->warn('⚠️  IMPORTANT: Change default passwords after first login!');
        $this->command->info('🌐 Access admin panel at: /admin/dashboard');
    }

    /**
     * Create specialized roles for different admin functions
     */
    private function createSpecializedRoles(): void
    {
        $specializedRoles = [
            'Master Data Admin' => 'Full access to all master data management functions',
            'Department Manager' => 'Manage departments, wards, and beds',
            'Pharmacy Manager' => 'Manage drug formulary and pharmacy data',
            'Laboratory Manager' => 'Manage test catalogs and laboratory data',
            'Read-Only Admin' => 'View-only access to admin functions',
            'Data Entry Specialist' => 'Create and edit master data entries',
        ];

        foreach ($specializedRoles as $roleName => $description) {
            Role::firstOrCreate(['name' => $roleName]);
            $this->command->info("Created/Updated role: {$roleName}");
        }
    }

    /**
     * Create an admin user with specific permissions
     */
    private function createAdminUser(array $userData): void
    {
        // Check if role exists
        $role = Role::where('name', $userData['role'])->first();
        
        if (!$role) {
            $this->command->warn("Role '{$userData['role']}' not found. Skipping user {$userData['email']}");
            return;
        }

        // Create or update user
        $user = User::updateOrCreate(
            ['email' => $userData['email']],
            [
                'name' => $userData['name'],
                'password' => Hash::make($userData['password']),
                'email_verified_at' => now(),
            ]
        );

        // Assign role
        if (!$user->hasRole($userData['role'])) {
            $user->assignRole($userData['role']);
        }

        // Assign specific permissions if provided
        if (!empty($userData['permissions'])) {
            foreach ($userData['permissions'] as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();
                if ($permission && !$user->hasPermissionTo($permission)) {
                    $user->givePermissionTo($permission);
                }
            }
        }

        $this->command->info("✅ Created/Updated admin user: {$userData['name']} ({$userData['email']})");
    }
}