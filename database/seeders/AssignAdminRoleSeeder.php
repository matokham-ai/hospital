<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class AssignAdminRoleSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        if ($user) {
            $adminRole = Role::where('name', 'admin')->first();
            if ($adminRole) {
                $user->assignRole($adminRole);
                echo "Admin role assigned to user: {$user->name}\n";
            } else {
                echo "Admin role not found\n";
            }
        } else {
            echo "No users found\n";
        }
    }
}