<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Encounter;
use App\Models\Bed;
use App\Models\BedAssignment;

class BedAssignmentSeeder extends Seeder
{
    public function run()
    {
        $encounters = Encounter::where('type', 'IPD')->where('status', 'active')->get();
        $beds = Bed::where('status', 'AVAILABLE')->take(3)->get();
        
        if ($encounters->isEmpty() || $beds->isEmpty()) {
            echo "No encounters or beds found. Please seed them first.\n";
            return;
        }

        foreach ($encounters->take(3) as $index => $encounter) {
            if (isset($beds[$index])) {
                BedAssignment::create([
                    'encounter_id' => $encounter->id,
                    'bed_id' => $beds[$index]->id,
                    'assigned_at' => now(),
                    'assigned_by' => 1 // Assuming user ID 1 exists
                ]);

                // Update bed status
                $beds[$index]->update(['status' => 'OCCUPIED']);
            }
        }

        echo "Bed assignments created successfully!\n";
    }
}