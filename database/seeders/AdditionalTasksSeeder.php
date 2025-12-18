<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class AdditionalTasksSeeder extends Seeder
{
    public function run(): void
    {
        // Get a nurse user
        $nurse = User::whereHas('roles', function($query) {
            $query->where('name', 'Nurse');
        })->first();

        if (!$nurse) {
            $nurse = User::first();
        }

        if (!$nurse) {
            $this->command->info('No users found. Please create users first.');
            return;
        }

        // Create additional tasks for pagination testing
        $tasks = [
            'Patient medication review',
            'Update nursing care plans',
            'Complete patient assessments',
            'Document vital signs trends',
            'Prepare discharge summaries',
            'Coordinate with physical therapy',
            'Review lab results with physician',
            'Update family on patient status',
            'Complete infection control checklist',
            'Prepare for incoming admissions',
            'Review emergency protocols',
            'Update patient education materials'
        ];

        foreach ($tasks as $index => $taskTitle) {
            Task::create([
                'title' => $taskTitle,
                'description' => "Complete {$taskTitle} as part of daily nursing responsibilities",
                'priority' => ['low', 'medium', 'high'][rand(0, 2)],
                'due_date' => Carbon::now()->addHours(rand(1, 48)),
                'assigned_to' => $nurse->id,
                'assigned_by' => $nurse->id,
            ]);
        }

        $this->command->info('Created 12 additional tasks for pagination testing!');
    }
}