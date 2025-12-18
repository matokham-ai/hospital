<?php
// database/seeders/SettingsSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run()
    {
        DB::table('settings')->insert([
            ['key' => 'site_name', 'value' => 'MediCare HMS', 'group' => 'general', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'hospital_email', 'value' => 'info@hospital.com', 'group' => 'general', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'currency_symbol', 'value' => 'KSh', 'group' => 'general', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'enable_sms_notifications', 'value' => '1', 'group' => 'features', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
