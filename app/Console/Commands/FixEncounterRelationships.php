<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Encounter;
use App\Models\Department;
use App\Models\Physician;

class FixEncounterRelationships extends Command
{
    protected $signature = 'encounters:fix-relationships';
    protected $description = 'Fix encounter physician and department relationships';

    public function handle()
    {
        $this->info('Fixing encounter relationships...');

        $departments = Department::pluck('deptid')->toArray();
        $physicians = Physician::pluck('physician_code')->toArray();

        if (empty($departments) || empty($physicians)) {
            $this->error('No departments or physicians found!');
            return 1;
        }

        $encounters = Encounter::all();
        $fixed = 0;

        foreach ($encounters as $encounter) {
            $updated = false;

            // Fix department_id if it's invalid
            if (!$encounter->department_id || !in_array($encounter->department_id, $departments)) {
                $encounter->department_id = $departments[array_rand($departments)];
                $updated = true;
            }

            // Fix attending_physician_id if it's invalid
            if (!$encounter->attending_physician_id || !in_array($encounter->attending_physician_id, $physicians)) {
                $encounter->attending_physician_id = $physicians[array_rand($physicians)];
                $updated = true;
            }

            if ($updated) {
                $encounter->save();
                $fixed++;
            }
        }

        $this->info("Fixed {$fixed} encounters");
        return 0;
    }
}