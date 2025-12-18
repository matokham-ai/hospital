<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create-user 
                            {--name= : The name of the admin user}
                            {--email= : The email of the admin user}
                            {--password= : The password for the admin user}
                            {--role=Admin : The role to assign to the user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user for the master data system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 Creating Admin User for Master Data System');
        $this->info('============================================');

        // Get user input
        $name = $this->option('name') ?: $this->ask('Enter the admin user name');
        $email = $this->option('email') ?: $this->ask('Enter the admin user email');
        $password = $this->option('password') ?: $this->secret('Enter the admin user password');
        $role = $this->option('role') ?: $this->choice('Select a role', $this->getAvailableRoles(), 'Admin');

        // Validate input
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('  - ' . $error);
            }
            return 1;
        }

        // Check if role exists
        $roleModel = Role::where('name', $role)->first();
        if (!$roleModel) {
            $this->error("Role '{$role}' does not exist.");
            return 1;
        }

        try {
            // Create user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            // Assign role
            $user->assignRole($role);

            $this->info('');
            $this->info('✅ Admin user created successfully!');
            $this->info('');
            $this->info('👤 User Details:');
            $this->info("   Name: {$name}");
            $this->info("   Email: {$email}");
            $this->info("   Role: {$role}");
            $this->info('');
            $this->info('🌐 The user can now access the admin panel at: /admin/dashboard');

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to create admin user: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Get available roles for admin users
     */
    private function getAvailableRoles(): array
    {
        return Role::pluck('name')->toArray();
    }
}