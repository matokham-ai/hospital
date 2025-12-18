<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'branch_code' => 'HQ001',
                'branch_name' => 'Main Hospital - Nairobi',
                'location' => 'Nairobi CBD',
                'address' => 'Kenyatta Avenue, Nairobi',
                'phone' => '+254-20-1234567',
                'email' => 'nairobi@hospital.com',
                'status' => 'active',
                'is_main_branch' => true,
                'manager_id' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'branch_code' => 'BR002',
                'branch_name' => 'Westlands Branch',
                'location' => 'Westlands',
                'address' => 'Waiyaki Way, Westlands, Nairobi',
                'phone' => '+254-20-2345678',
                'email' => 'westlands@hospital.com',
                'status' => 'active',
                'is_main_branch' => false,
                'manager_id' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'branch_code' => 'BR003',
                'branch_name' => 'Mombasa Branch',
                'location' => 'Mombasa',
                'address' => 'Moi Avenue, Mombasa',
                'phone' => '+254-41-3456789',
                'email' => 'mombasa@hospital.com',
                'status' => 'active',
                'is_main_branch' => false,
                'manager_id' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'branch_code' => 'BR004',
                'branch_name' => 'Kisumu Branch',
                'location' => 'Kisumu',
                'address' => 'Oginga Odinga Street, Kisumu',
                'phone' => '+254-57-4567890',
                'email' => 'kisumu@hospital.com',
                'status' => 'active',
                'is_main_branch' => false,
                'manager_id' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'branch_code' => 'BR005',
                'branch_name' => 'Nakuru Branch',
                'location' => 'Nakuru',
                'address' => 'Kenyatta Avenue, Nakuru',
                'phone' => '+254-51-5678901',
                'email' => 'nakuru@hospital.com',
                'status' => 'active',
                'is_main_branch' => false,
                'manager_id' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        DB::table('branches')->insert($branches);

        $this->command->info('✅ Branches seeded successfully!');
    }
}
