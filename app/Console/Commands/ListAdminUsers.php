<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Spatie\Permission\Models\Role;

class ListAdminUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:list-users {--role= : Filter by specific role}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all admin users in the system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('👥 Admin Users in Master Data System');
        $this->info('===================================');

        $roleFilter = $this->option('role');

        // Get admin roles
        $adminRoles = [
            'Admin',
            'Hospital Administrator', 
            'Master Data Admin',
            'Department Manager',
            'Pharmacy Manager',
            'Laboratory Manager',
            'Read-Only Admin',
            'Data Entry Specialist'
        ];

        $query = User::with('roles');

        if ($roleFilter) {
            $query->whereHas('roles', function($q) use ($roleFilter) {
                $q->where('name', $roleFilter);
            });
            $this->info("Filtering by role: {$roleFilter}");
            $this->info('');
        } else {
            $query->whereHas('roles', function($q) use ($adminRoles) {
                $q->whereIn('name', $adminRoles);
            });
        }

        $users = $query->get();

        if ($users->isEmpty()) {
            $this->warn('No admin users found.');
            return 0;
        }

        // Create table data
        $tableData = [];
        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->join(', ');
            $tableData[] = [
                $user->id,
                $user->name,
                $user->email,
                $roles,
                $user->email_verified_at ? '✅' : '❌',
                $user->created_at->format('Y-m-d H:i'),
            ];
        }

        // Display table
        $this->table([
            'ID',
            'Name',
            'Email',
            'Roles',
            'Verified',
            'Created At'
        ], $tableData);

        $this->info('');
        $this->info("Total admin users: {$users->count()}");

        // Show role statistics
        $this->info('');
        $this->info('📊 Role Distribution:');
        $roleStats = [];
        foreach ($adminRoles as $role) {
            $count = User::whereHas('roles', function($q) use ($role) {
                $q->where('name', $role);
            })->count();
            
            if ($count > 0) {
                $roleStats[] = "  {$role}: {$count} users";
            }
        }

        foreach ($roleStats as $stat) {
            $this->info($stat);
        }

        return 0;
    }
}