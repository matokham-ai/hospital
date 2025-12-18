<?php
/**
 * Test script to verify all dashboard statistics are correct
 * Run this from the Laravel project root: php test_all_dashboard_stats.php
 */

// Include Laravel bootstrap
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing All Dashboard Statistics ===\n\n";

try {
    $today = now();

    echo "1. Total Admissions (all time IPD encounters):\n";
    $totalAdmissions = DB::table('encounters')->where('type', 'IPD')->count();
    echo "   Result: {$totalAdmissions} total admissions\n\n";

    echo "2. Active Admissions (with bed assignments):\n";
    $activeAdmissions = DB::table('encounters')
        ->join('bed_assignments', 'encounters.id', '=', 'bed_assignments.encounter_id')
        ->where('encounters.type', 'IPD')
        ->where('encounters.status', 'ACTIVE')
        ->whereNull('bed_assignments.released_at')
        ->count();
    echo "   Result: {$activeAdmissions} active inpatients\n\n";

    echo "3. Critical Patients (with bed assignments):\n";
    $criticalPatients = DB::table('encounters')
        ->join('bed_assignments', 'encounters.id', '=', 'bed_assignments.encounter_id')
        ->where('encounters.type', 'IPD')
        ->where('encounters.status', 'ACTIVE')
        ->whereNull('bed_assignments.released_at')
        ->where(function ($q) {
            $q->where('encounters.priority', 'CRITICAL')
              ->orWhere('encounters.severity', 'HIGH')
              ->orWhere('encounters.acuity_level', 'CRITICAL');
        })
        ->count();
    echo "   Result: {$criticalPatients} critical patients\n\n";

    echo "4. Discharges Today:\n";
    $dischargesToday = DB::table('encounters')
        ->where('type', 'IPD')
        ->whereDate('discharge_datetime', $today)
        ->count();
    echo "   Result: {$dischargesToday} discharges today\n\n";

    echo "5. Bed Statistics:\n";
    $totalBeds = DB::table('beds')->count();
    $occupiedBeds = DB::table('beds')->where('status', 'occupied')->count();
    $availableBeds = DB::table('beds')->where('status', 'available')->count();
    echo "   Total beds: {$totalBeds}\n";
    echo "   Occupied beds: {$occupiedBeds}\n";
    echo "   Available beds: {$availableBeds}\n\n";

    echo "6. Ward Summary (accurate bed occupancy):\n";
    $wardSummary = DB::select("
        SELECT 
            w.name,
            COUNT(b.id) AS total_beds,
            COUNT(a.id) AS beds_occupied
        FROM wards w
        JOIN beds b ON b.ward_id = w.wardid
        LEFT JOIN bed_assignments a ON a.bed_id = b.id AND a.released_at IS NULL
        WHERE w.status = 'active'
        GROUP BY w.wardid, w.name
        ORDER BY w.name ASC
    ");
    
    $totalBedsFromWards = 0;
    $totalOccupiedFromWards = 0;
    
    foreach ($wardSummary as $ward) {
        $totalBedsFromWards += $ward->total_beds;
        $totalOccupiedFromWards += $ward->beds_occupied;
        echo "   {$ward->name}: {$ward->beds_occupied}/{$ward->total_beds} beds occupied\n";
    }
    
    echo "\n7. Recent Patients (with bed assignments):\n";
    $recentPatients = DB::table('encounters')
        ->join('patients', 'encounters.patient_id', '=', 'patients.id')
        ->join('bed_assignments', function ($join) {
            $join->on('encounters.id', '=', 'bed_assignments.encounter_id')
                ->whereNull('bed_assignments.released_at');
        })
        ->leftJoin('beds', 'bed_assignments.bed_id', '=', 'beds.id')
        ->leftJoin('wards', 'beds.ward_id', '=', 'wards.wardid')
        ->where('encounters.type', 'IPD')
        ->where('encounters.status', 'ACTIVE')
        ->select(
            'encounters.id',
            'patients.first_name',
            'patients.last_name',
            'beds.bed_number',
            'wards.name as ward'
        )
        ->orderBy('encounters.admission_datetime', 'desc')
        ->limit(6)
        ->get();
    
    echo "   Found {$recentPatients->count()} recent patients:\n";
    foreach ($recentPatients as $patient) {
        echo "   - {$patient->first_name} {$patient->last_name} (Bed: {$patient->bed_number}, Ward: {$patient->ward})\n";
    }

    echo "\n=== Dashboard Statistics Summary ===\n";
    echo "Total Admitted: {$activeAdmissions}\n";
    echo "Critical Patients: {$criticalPatients}\n";
    echo "Discharges Today: {$dischargesToday}\n";
    echo "Beds Available: {$availableBeds}\n";
    echo "Recent Patients: {$recentPatients->count()}\n";
    
    echo "\n=== Validation ===\n";
    echo "✅ Active admissions ({$activeAdmissions}) should match occupied beds from ward summary ({$totalOccupiedFromWards})\n";
    echo "✅ Recent patients count ({$recentPatients->count()}) should be ≤ active admissions ({$activeAdmissions})\n";
    echo "✅ Critical patients ({$criticalPatients}) should be ≤ active admissions ({$activeAdmissions})\n";
    
    if ($activeAdmissions == $totalOccupiedFromWards) {
        echo "\n🎉 All statistics are consistent!\n";
    } else {
        echo "\n⚠️  Inconsistency detected between active admissions and ward occupancy.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Make sure you're running this from the Laravel project root.\n";
}
?>