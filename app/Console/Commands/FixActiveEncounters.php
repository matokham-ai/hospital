<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixActiveEncounters extends Command
{
    protected $signature = 'encounters:fix-active';
    protected $description = 'Fix active encounters that should be completed based on bed assignments';

    public function handle()
    {
        $this->info('Checking for active encounters without bed assignments...');
        
        // Find active IPD encounters that don't have active bed assignments
        $orphanedEncounters = DB::table('encounters')
            ->leftJoin('bed_assignments', function ($join) {
                $join->on('encounters.id', '=', 'bed_assignments.encounter_id')
                    ->whereNull('bed_assignments.released_at');
            })
            ->where('encounters.type', 'IPD')
            ->where('encounters.status', 'ACTIVE')
            ->whereNull('bed_assignments.id')
            ->select('encounters.id', 'encounters.encounter_number')
            ->get();

        if ($orphanedEncounters->isEmpty()) {
            $this->info('✅ No orphaned encounters found. All active encounters have bed assignments.');
            return;
        }

        $this->warn("Found {$orphanedEncounters->count()} active encounters without bed assignments:");
        
        foreach ($orphanedEncounters as $encounter) {
            $this->line("- Encounter ID: {$encounter->id} ({$encounter->encounter_number})");
        }

        if ($this->confirm('Do you want to mark these encounters as COMPLETED?')) {
            $updated = DB::table('encounters')
                ->whereIn('id', $orphanedEncounters->pluck('id'))
                ->update([
                    'status' => 'COMPLETED',
                    'discharge_datetime' => now(),
                    'updated_at' => now()
                ]);

            $this->info("✅ Updated {$updated} encounters to COMPLETED status.");
            
            // Show updated stats
            $activeCount = DB::table('encounters')
                ->where('type', 'IPD')
                ->where('status', 'ACTIVE')
                ->count();
                
            $this->info("📊 Current active IPD encounters: {$activeCount}");
        } else {
            $this->info('No changes made.');
        }
    }
}