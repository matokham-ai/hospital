<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure roles exist (this will be handled by RolePermissionSeeder)
        $this->command->info('Creating admin users for master data system...');

        // Admin users with different levels of access
        $adminUsers = [
            [
                'name' => 'Super Administrator',
                'email' => 'superadmin@hospital.com',
                'password' => 'SuperAdmin@123',
                'role' => 'Admin',
                'description' => 'Full system access including all admin functions'
            ],
            [
                'name' => 'Hospital Administrator',
                'email' => 'hospital.admin@hospital.com',
                'password' => 'HospitalAdmin@123',
                'role' => 'Hospital Administrator',
                'description' => 'Full access to master data management'
            ],
            [
                'name' => 'Master Data Manager',
                'email' => 'masterdata.manager@hospital.com',
                'password' => 'MasterData@123',
                'role' => 'Hospital Administrator',
                'description' => 'Specialized in managing hospital master data'
            ],
            [
                'name' => 'Department Head - Admin',
                'email' => 'dept.admin@hospital.com',
                'password' => 'DeptAdmin@123',
                'role' => 'Hospital Administrator',
                'description' => 'Department head with admin privileges'
            ],
        ];

        // Clinical staff users
        $clinicalUsers = [
            [
                'name' => 'Dr. Sarah Johnson',
                'email' => 'sarah.johnson@hospital.com',
                'password' => 'Doctor@123',
                'role' => 'Doctor',
                'description' => 'Senior Physician - Cardiology'
            ],
            [
                'name' => 'Dr. Michael Chen',
                'email' => 'michael.chen@hospital.com',
                'password' => 'Doctor@123',
                'role' => 'Doctor',
                'description' => 'Emergency Medicine Specialist'
            ],
            [
                'name' => 'Dr. Emily Rodriguez',
                'email' => 'emily.rodriguez@hospital.com',
                'password' => 'Doctor@123',
                'role' => 'Doctor',
                'description' => 'Pediatrician'
            ],
            [
                'name' => 'Nurse Manager Lisa',
                'email' => 'lisa.manager@hospital.com',
                'password' => 'Nurse@123',
                'role' => 'Nurse',
                'description' => 'Head Nurse - ICU'
            ],
            [
                'name' => 'Nurse Jennifer Smith',
                'email' => 'jennifer.smith@hospital.com',
                'password' => 'Nurse@123',
                'role' => 'Nurse',
                'description' => 'Staff Nurse - General Ward'
            ],
            [
                'name' => 'Nurse Robert Wilson',
                'email' => 'robert.wilson@hospital.com',
                'password' => 'Nurse@123',
                'role' => 'Nurse',
                'description' => 'Staff Nurse - Emergency Department'
            ],
        ];

        // Support staff users
        $supportUsers = [
            [
                'name' => 'Pharmacist David Lee',
                'email' => 'david.lee@hospital.com',
                'password' => 'Pharmacist@123',
                'role' => 'Pharmacist',
                'description' => 'Chief Pharmacist'
            ],
            [
                'name' => 'Pharmacist Anna Kumar',
                'email' => 'anna.kumar@hospital.com',
                'password' => 'Pharmacist@123',
                'role' => 'Pharmacist',
                'description' => 'Clinical Pharmacist'
            ],
            [
                'name' => 'Lab Tech James Brown',
                'email' => 'james.brown@hospital.com',
                'password' => 'LabTech@123',
                'role' => 'Lab Technician',
                'description' => 'Senior Laboratory Technician'
            ],
            [
                'name' => 'Lab Tech Maria Garcia',
                'email' => 'maria.garcia@hospital.com',
                'password' => 'LabTech@123',
                'role' => 'Lab Technician',
                'description' => 'Microbiology Specialist'
            ],
            [
                'name' => 'Radiologist Dr. Thomas Anderson',
                'email' => 'thomas.anderson@hospital.com',
                'password' => 'Radiologist@123',
                'role' => 'Radiologist',
                'description' => 'Senior Radiologist'
            ],
            [
                'name' => 'Cashier Patricia Davis',
                'email' => 'patricia.davis@hospital.com',
                'password' => 'Cashier@123',
                'role' => 'Cashier',
                'description' => 'Billing Department Cashier'
            ],
            [
                'name' => 'Receptionist Amanda White',
                'email' => 'amanda.white@hospital.com',
                'password' => 'Reception@123',
                'role' => 'Receptionist',
                'description' => 'Front Desk Receptionist'
            ],
            [
                'name' => 'Receptionist Carlos Martinez',
                'email' => 'carlos.martinez@hospital.com',
                'password' => 'Reception@123',
                'role' => 'Receptionist',
                'description' => 'Emergency Department Receptionist'
            ],
        ];

        // Combine all users
        $allUsers = array_merge($adminUsers, $clinicalUsers, $supportUsers);

        foreach ($allUsers as $userData) {
            $this->createUser($userData);
        }

        $this->command->info('Created ' . count($allUsers) . ' users successfully!');
        $this->command->info('');
        $this->command->info('Admin Users for Master Data System:');
        $this->command->info('=====================================');
        
        foreach ($adminUsers as $user) {
            $this->command->info("Email: {$user['email']} | Password: {$user['password']} | Role: {$user['role']}");
        }
        
        $this->command->info('');
        $this->command->info('Note: Please change default passwords after first login!');
    }

    /**
     * Create a user with the specified data
     */
    private function createUser(array $userData): void
    {
        // Check if role exists
        $role = Role::where('name', $userData['role'])->first();
        
        if (!$role) {
            $this->command->warn("Role '{$userData['role']}' not found. Skipping user {$userData['email']}");
            return;
        }

        // Get first available branch for nurses
        $branchId = null;
        if ($userData['role'] === 'Nurse') {
            $branch = \App\Models\Branch::first();
            if ($branch) {
                $branchId = $branch->id;
            }
        }

        // Create or update user
        $user = User::updateOrCreate(
            ['email' => $userData['email']],
            [
                'name' => $userData['name'],
                'password' => Hash::make($userData['password']),
                'email_verified_at' => now(),
                'branch_id' => $branchId,
            ]
        );

        // Assign role if not already assigned
        if (!$user->hasRole($userData['role'])) {
            $user->assignRole($userData['role']);
        }

        $branchInfo = $branchId ? " - Branch ID: {$branchId}" : "";
        $this->command->info("Created/Updated user: {$userData['name']} ({$userData['email']}) - Role: {$userData['role']}{$branchInfo}");
    }
}