<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemSettingsController extends Controller
{
    public function index()
    {
        // Get all settings grouped by category
        $settings = Setting::all()->groupBy('group');
        
        // Define setting categories with metadata
        $categories = [
            'general' => [
                'title' => 'General Settings',
                'description' => 'Basic hospital information and configuration',
                'icon' => 'Settings'
            ],
            'appearance' => [
                'title' => 'Appearance & Branding',
                'description' => 'Customize the look and feel of your system',
                'icon' => 'Palette'
            ],
            'notifications' => [
                'title' => 'Notifications',
                'description' => 'Configure email and SMS notification settings',
                'icon' => 'Bell'
            ],
            'security' => [
                'title' => 'Security Settings',
                'description' => 'Password policies and security configurations',
                'icon' => 'Shield'
            ],
            'billing' => [
                'title' => 'Billing & Finance',
                'description' => 'Currency, tax, and billing configuration',
                'icon' => 'CreditCard'
            ],
            'system' => [
                'title' => 'System Configuration',
                'description' => 'Technical settings and system preferences',
                'icon' => 'Server'
            ]
        ];

        // Ensure default settings exist
        $this->ensureDefaultSettings();
        
        // Refresh settings after ensuring defaults
        $settings = Setting::all()->groupBy('group');

        return Inertia::render('Admin/SystemSettings', [
            'settings' => $settings,
            'categories' => $categories
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            '*' => 'nullable|string|max:1000'
        ]);

        foreach ($validated as $key => $value) {
            if ($value !== null) {
                Setting::setValue($key, $value);
            }
        }

        return back()->with('success', 'System settings updated successfully.');
    }

    private function ensureDefaultSettings()
    {
        $defaults = [
            // General Settings
            'hospital_name' => ['value' => 'MediCare Hospital', 'group' => 'general'],
            'hospital_address' => ['value' => '', 'group' => 'general'],
            'hospital_phone' => ['value' => '', 'group' => 'general'],
            'hospital_email' => ['value' => 'info@medicare.com', 'group' => 'general'],
            'hospital_website' => ['value' => '', 'group' => 'general'],
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
            'notification_email' => ['value' => '', 'group' => 'notifications'],
            'smtp_host' => ['value' => '', 'group' => 'notifications'],
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
            'tax_rate' => ['value' => '0', 'group' => 'billing'],
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
            Setting::firstOrCreate(
                ['key' => $key],
                [
                    'value' => $config['value'],
                    'group' => $config['group']
                ]
            );
        }
    }
}
