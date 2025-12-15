<?php
/**
 * Test script to verify the care plans patient list fix
 * Run this from the Laravel project root: php test_care_plans_fix.php
 */

// Include Laravel bootstrap
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Encounter;

echo "=== Testing Care Plans Patient List Fix ===\n\n";

try {
    // Test the old method (all active IPD encounters)
    echo "1. Old method (all active IPD encounters):\n";
    $oldEncounters = Encounter::with('patient')
        ->where('type', 'IPD')
        ->where('status', 'ACTIVE')
        ->orderByDesc('admission_datetime')
        ->get();
    
    echo "   Found {$oldEncounters->count()} encounters:\n";
    foreach ($oldEncounters as $encounter) {
        echo "   - {$encounter->patient->first_name} {$encounter->patient->last_name} (ID: {$encounter->id})\n";
    }
    echo "\n";

    // Test the new method (only encounters with bed assignments)
    echo "2. New method (only encounters with active bed assignments):\n";
    $newEncounters = Encounter::with(['patient', 'bedAssignments.bed.ward'])
        ->where('type', 'IPD')
        ->where('status', 'ACTIVE')
        ->whereHas('bedAssignments', function ($query) {
            $query->whereNull('released_at');
        })
        ->orderByDesc('admission_datetime')
        ->get();
    
    echo "   Found {$newEncounters->count()} encounters:\n";
    foreach ($newEncounters as $encounter) {
        $bedInfo = $encounter->bedAssignments->first();
        $bedNumber = $bedInfo && $bedInfo->bed ? $bedInfo->bed->bed_number : 'No bed';
        $wardName = $bedInfo && $bedInfo->bed && $bedInfo->bed->ward ? $bedInfo->bed->ward->name : 'No ward';
        echo "   - {$encounter->patient->first_name} {$encounter->patient->last_name} (ID: {$encounter->id}) - Bed: {$bedNumber}, Ward: {$wardName}\n";
    }
    echo "\n";

    // Test the doctor rounds assigned patients query
    echo "3. Doctor rounds assigned patients (new method):\n";
    $assignedPatients = DB::table('patients as p')
        ->join('encounters as e', 'e.patient_id', '=', 'p.id')
        ->join('bed_assignments as ba', 'e.id', '=', 'ba.encounter_id')
        ->select(
            'p.id',
            'p.first_name',
            'p.last_name',
            'p.hospital_id',
            'e.encounter_number',
            'e.admission_datetime',
            'e.attending_physician_id'
        )
        ->where('e.type', 'IPD')
        ->where('e.status', 'ACTIVE')
        ->whereNull('e.discharge_datetime')
        ->whereNull('ba.released_at')
        ->distinct()
        ->orderByDesc('e.admission_datetime')
        ->limit(20)
        ->get();
    
    echo "   Found {$assignedPatients->count()} assigned patients:\n";
    foreach ($assignedPatients as $patient) {
        echo "   - {$patient->first_name} {$patient->last_name} (ID: {$patient->id}) - Encounter: {$patient->encounter_number}\n";
    }
    echo "\n";

    echo "=== Summary ===\n";
    echo "Care Plans page should now show: {$newEncounters->count()} patients (instead of {$oldEncounters->count()})\n";
    echo "Doctor Rounds page should now show: {$assignedPatients->count()} assigned patients\n";
    
    if ($newEncounters->count() != $oldEncounters->count()) {
        echo "\n✅ Fix is working! Patient count changed from {$oldEncounters->count()} to {$newEncounters->count()}\n";
        echo "Only patients with actual bed assignments are now shown.\n";
    } else {
        echo "\n⚠️  Counts are the same. This could mean:\n";
        echo "   - All active encounters have bed assignments (good)\n";
        echo "   - Or there are no active encounters at all\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Make sure you're running this from the Laravel project root.\n";
}
?>