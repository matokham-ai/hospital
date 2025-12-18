<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // General Settings
            'hospital_name' => ['value' => 'MediCare Hospital', 'group' => 'general'],
            'hospital_address' => ['value' => '123 Medical Center Drive, Healthcare City, HC 12345', 'group' => 'general'],
            'hospital_phone' => ['value' => '+1 (555) 123-4567', 'group' => 'general'],
            'hospital_email' => ['value' => 'info@medicare.com', 'group' => 'general'],
            'hospital_website' => ['value' => 'https://medicare.com', 'group' => 'general'],
            'timezone' => ['value' => 'America/New_York', 'group' => 'general'],
            'date_format' => ['value' => 'M j, Y', 'group' => 'general'],
            'time_format' => ['value' => 'h:i A', 'group' => 'general'],

            // Appearance & Branding
            'primary_color' => ['value' => '#0ea5e9', 'group' => 'appearance'],
            'secondary_color' => ['value' => '#64748b', 'group' => 'appearance'],
            'logo_url' => ['value' => '', 'group' => 'appearance'],
            'favicon_url' => ['value' => '', 'group' => 'appearance'],
            'theme_mode' => ['value' => 'light', 'group' => 'appearance'],

            // Notifications
            'email_notifications' => ['value' => 'true', 'group' => 'notifications'],
            'sms_notifications' => ['value' => 'false', 'group' => 'notifications'],
            'notification_email' => ['value' => 'admin@medicare.com', 'group' => 'notifications'],
            'smtp_host' => ['value' => 'smtp.gmail.com', 'group' => 'notifications'],
            'smtp_port' => ['value' => '587', 'group' => 'notifications'],
            'smtp_username' => ['value' => '', 'group' => 'notifications'],
            'smtp_password' => ['value' => '', 'group' => 'notifications'],

            // Security
            'password_min_length' => ['value' => '8', 'group' => 'security'],
            'password_require_uppercase' => ['value' => 'true', 'group' => 'security'],
            'password_require_numbers' => ['value' => 'true', 'group' => 'security'],
            'password_require_symbols' => ['value' => 'false', 'group' => 'security'],
            'session_timeout' => ['value' => '120', 'group' => 'security'],
            'max_login_attempts' => ['value' => '5', 'group' => 'security'],

            // Billing & Finance
            'currency_code' => ['value' => 'USD', 'group' => 'billing'],
            'currency_symbol' => ['value' => '$', 'group' => 'billing'],
            'tax_rate' => ['value' => '8.5', 'group' => 'billing'],
            'invoice_prefix' => ['value' => 'INV-', 'group' => 'billing'],
            'payment_terms' => ['value' => '30', 'group' => 'billing'],

            // System Configuration
            'maintenance_mode' => ['value' => 'false', 'group' => 'system'],
            'debug_mode' => ['value' => 'false', 'group' => 'system'],
            'backup_frequency' => ['value' => 'daily', 'group' => 'system'],
            'log_level' => ['value' => 'info', 'group' => 'system'],
            'max_file_upload_size' => ['value' => '10', 'group' => 'system'],
        ];

        foreach ($defaults as $key => $config) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $config['value'],
                    'group' => $config['group']
                ]
            );
        }
    }
}