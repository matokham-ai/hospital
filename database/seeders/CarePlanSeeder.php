<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CarePlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $encounters = \App\Models\Encounter::where('status', 'ACTIVE')->take(5)->get();
        $users = \App\Models\User::role('Nurse')->get();
        
        if ($encounters->isEmpty() || $users->isEmpty()) {
            $this->command->warn('No active encounters or nurse users found. Skipping care plan seeding.');
            return;
        }

        $statuses = ['pending', 'in_progress', 'completed'];
        $shifts = ['morning', 'afternoon', 'night'];
        $today = now();

        foreach ($encounters as $encounter) {
            // Create care plans for today and yesterday
            for ($i = 0; $i <= 1; $i++) {
                $planDate = $today->copy()->subDays($i);
                
                foreach (['morning', 'afternoon', 'night'] as $shift) {
                    \App\Models\CarePlan::create([
                        'encounter_id' => $encounter->id,
                        'plan_date' => $planDate,
                        'shift' => $shift,
                        'status' => $i === 0 ? ($shift === 'morning' ? 'completed' : 'pending') : 'completed',
                        'objectives' => "Monitor vital signs, administer medications, assess pain levels for {$shift} shift",
                        'nursing_notes' => $i === 0 && $shift !== 'morning' ? null : "Patient stable during {$shift} shift. All medications administered as scheduled.",
                        'doctor_notes' => $i === 0 ? null : "Continue current treatment plan. Monitor for any changes.",
                        'diet' => 'Regular diet, encourage fluid intake',
                        'hydration' => 'IV fluids 1000ml over 8 hours',
                        'created_by' => $users->random()->id,
                    ]);
                }
            }
        }

        $this->command->info('Care plans seeded successfully!');
    }
}
