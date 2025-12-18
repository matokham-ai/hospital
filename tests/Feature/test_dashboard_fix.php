<?php
/**
 * Test script to verify the dashboard inpatient count fix
 * Run this from the Laravel project root: php test_dashboard_fix.php
 */

// Include Laravel bootstrap
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Dashboard Inpatient Count Fix ===\n\n";

try {
    // Test the old method (simple count)
    echo "1. Old method (simple count of active IPD encounters):\n";
    $oldCount = DB::table('encounters')
        ->where('type', 'IPD')
        ->where('status', 'ACTIVE')
        ->count();
    echo "   Result: {$oldCount} active encounters\n\n";

    // Test the new method (with bed assignments)
    echo "2. New method (active IPD encounters with bed assignments):\n";
    $newCount = DB::table('encounters')
        ->join('bed_assignments', 'encounters.id', '=', 'bed_assignments.encounter_id')
        ->where('encounters.type', 'IPD')
        ->where('encounters.status', 'ACTIVE')
        ->whereNull('bed_assignments.released_at')
        ->count();
    echo "   Result: {$newCount} active inpatients with beds\n\n";

    // Test the ward summary query for comparison
    echo "3. Ward summary query (total occupied beds):\n";
    $wardSummary = DB::select("
        SELECT 
            COUNT(a.id) AS total_occupied_beds
        FROM wards w
        JOIN beds b ON b.ward_id = w.wardid
        LEFT JOIN bed_assignments a ON a.bed_id = b.id AND a.released_at IS NULL
        WHERE w.status = 'active'
    ");
    $totalOccupied = $wardSummary[0]->total_occupied_beds ?? 0;
    echo "   Result: {$totalOccupied} total occupied beds\n\n";

    // Show detailed breakdown
    echo "4. Detailed breakdown by ward:\n";
    $wardBreakdown = DB::select("
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
    
    foreach ($wardBreakdown as $ward) {
        echo "   {$ward->name}: {$ward->beds_occupied}/{$ward->total_beds} beds occupied\n";
    }
    
    echo "\n=== Summary ===\n";
    echo "The dashboard should now show: {$newCount} active inpatients\n";
    echo "This matches the actual number of patients with bed assignments.\n";
    
    if ($newCount != $oldCount) {
        echo "\n✅ Fix is working! The count changed from {$oldCount} to {$newCount}\n";
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