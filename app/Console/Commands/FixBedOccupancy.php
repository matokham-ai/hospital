<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixBedOccupancy extends Command
{
    protected $signature = 'beds:fix-occupancy';
    protected $description = 'Fix bed occupancy status based on active bed assignments';

    public function handle()
    {
        $this->info('Starting bed occupancy fix...');

        DB::beginTransaction();

        try {
            // Step 1: Reset all beds to available first
            $totalBeds = DB::table('beds')->count();
            DB::table('beds')->update(['status' => 'available']);
            $this->info("Reset {$totalBeds} beds to available status");

            // Step 2: Mark beds as occupied based on active bed assignments
            $occupiedBeds = DB::table('beds')
                ->join('bed_assignments', 'beds.id', '=', 'bed_assignments.bed_id')
                ->join('encounters', 'bed_assignments.encounter_id', '=', 'encounters.id')
                ->whereNull('bed_assignments.released_at')
                ->where('encounters.status', 'ACTIVE')
                ->where('encounters.type', 'IPD')
                ->update(['beds.status' => 'occupied']);

            $this->info("Marked {$occupiedBeds} beds as occupied based on active assignments");

            // Step 3: Show summary
            $this->showSummary();

            DB::commit();
            $this->info('✅ Bed occupancy fix completed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error fixing bed occupancy: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    private function showSummary()
    {
        $this->info("\n📊 Bed Occupancy Summary:");
        
        $stats = DB::table('beds')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        foreach ($stats as $stat) {
            $this->line("   - {$stat->status}: {$stat->count} beds");
        }

        $activeAssignments = DB::table('bed_assignments')
            ->whereNull('released_at')
            ->count();
        
        $this->line("   - Active bed assignments: {$activeAssignments}");

        // Show any mismatches
        $occupiedBedsCount = DB::table('beds')->where('status', 'occupied')->count();
        if ($occupiedBedsCount !== $activeAssignments) {
            $this->warn("⚠️  Mismatch detected: {$occupiedBedsCount} occupied beds vs {$activeAssignments} active assignments");
        } else {
            $this->info("✅ Bed status matches active assignments");
        }
    }
}