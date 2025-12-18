<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BedAssignmentsSeeder extends Seeder
{
    public function run(): void
    {
        echo "🛏️  Creating Bed Assignments...\n";

        // Optional: reset old records for a clean slate
        DB::table('bed_assignments')->truncate();

        // Fetch inpatient encounters
        $encounters = DB::table('encounters')
            ->where('type', 'IPD')
            ->get();

        // Fetch available beds
        $availableBeds = DB::table('beds')
            ->where('status', 'AVAILABLE')
            ->get();

        if ($encounters->isEmpty()) {
            echo "⚠️  No inpatient encounters found. Please seed encounters first.\n";
            return;
        }

        if ($availableBeds->isEmpty()) {
            echo "⚠️  No available beds found. Please seed beds first.\n";
            return;
        }

        // Fetch admin user for attribution
        $adminUser = DB::table('users')->where('email', 'admin@hospital.com')->first();
        $assignedBy = $adminUser ? $adminUser->id : 1;

        $assignments = [];
        $usedBeds = [];

        foreach ($encounters as $encounter) {
            // Find an available bed
            $availableBed = null;
            foreach ($availableBeds as $bed) {
                if (!in_array($bed->id, $usedBeds)) {
                    $availableBed = $bed;
                    $usedBeds[] = $bed->id;
                    break;
                }
            }

            if (!$availableBed) {
                $availableBed = $availableBeds->random();
            }

            $assignedAt = Carbon::parse($encounter->admission_datetime ?? now()->subDays(rand(1, 5)));

            $isActive = in_array($encounter->status, ['ACTIVE', 'ONGOING', 'ADMITTED']);
            $releasedAt = $isActive ? null : ($encounter->discharge_datetime
                ? Carbon::parse($encounter->discharge_datetime)
                : $assignedAt->copy()->addDays(rand(1, 7)));

            $releasedBy = $isActive ? null : $assignedBy;
            $releaseNotes = $isActive
                ? null
                : ($encounter->status === 'COMPLETED'
                    ? 'Patient discharged successfully'
                    : 'Encounter ended, bed released');

            $assignments[] = [
                'encounter_id' => $encounter->id,
                'bed_id' => $availableBed->id,
                'assigned_at' => $assignedAt,
                'released_at' => $releasedAt,
                'assigned_by' => $assignedBy,
                'released_by' => $releasedBy,
                'assignment_notes' => "Bed assigned for {$encounter->type} encounter",
                'release_notes' => $releaseNotes,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($assignments, 50) as $chunk) {
            DB::table('bed_assignments')->insert($chunk);
        }

        echo "✅ Created " . count($assignments) . " bed assignments\n";

        $this->syncBedStatuses();
        $this->showSummary();
    }

    private function syncBedStatuses(): void
    {
        echo "🔄 Syncing bed statuses...\n";

        DB::statement("
            UPDATE beds
            JOIN bed_assignments ON bed_assignments.bed_id = beds.id
            SET beds.status = 'OCCUPIED'
            WHERE bed_assignments.released_at IS NULL
        ");

        DB::statement("
            UPDATE beds
            JOIN bed_assignments ON bed_assignments.bed_id = beds.id
            SET beds.status = 'AVAILABLE'
            WHERE bed_assignments.released_at IS NOT NULL
        ");

        echo "✅ Bed statuses synchronized.\n";
    }

    private function showSummary(): void
    {
        echo "\n📊 Bed Assignments Summary:\n";

        $active = DB::table('bed_assignments')->whereNull('released_at')->count();
        $released = DB::table('bed_assignments')->whereNotNull('released_at')->count();

        echo "   - Active Assignments: {$active}\n";
        echo "   - Released Assignments: {$released}\n";

        echo "\n🏨 Assignments by Ward:\n";
        $wardAssignments = DB::table('bed_assignments')
            ->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
            ->join('wards', 'beds.ward_id', '=', 'wards.wardid') // ✅ uses wardid not id
            ->select('wards.name', DB::raw('COUNT(*) as total'))
            ->groupBy('wards.name')
            ->orderBy('total', 'desc')
            ->get();

        foreach ($wardAssignments as $ward) {
            echo "   - {$ward->name}: {$ward->total} assignments\n";
        }

        $total = DB::table('bed_assignments')->count();
        $uniqueEncounters = DB::table('bed_assignments')->distinct('encounter_id')->count();
        $uniqueBeds = DB::table('bed_assignments')->distinct('bed_id')->count();

        echo "\n🎯 Overall: {$total} assignments across {$uniqueEncounters} encounters using {$uniqueBeds} beds\n";
    }
}
