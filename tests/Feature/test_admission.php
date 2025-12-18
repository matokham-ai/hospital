test admission


<?php
// Test script for the corrected admission function
require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== Testing Corrected Admission Logic ===\n\n";

try {
    DB::beginTransaction();

    // Get sample data
    $patient = DB::table('patients')->first();
    $bed = DB::table('beds')->where('status', 'available')->first();
    $physician = DB::table('physicians')->first();

    if (!$patient || !$bed || !$physician) {
        echo "❌ Missing required data:\n";
        echo "Patient: " . ($patient ? "✅" : "❌") . "\n";
        echo "Available bed: " . ($bed ? "✅" : "❌") . "\n";
        echo "Physician: " . ($physician ? "✅" : "❌") . "\n";
        exit(1);
    }

    echo "Using test data:\n";
    echo "Patient ID: {$patient->id}\n";
    echo "Bed ID: {$bed->id}\n";
    echo "Physician Code: {$physician->physician_code}\n\n";

    // Test 1: Create encounter with correct data types
    echo "1. Testing encounter creation:\n";
    $encounterId = DB::table('encounters')->insertGetId([
        'patient_id' => $patient->id, // String
        'encounter_number' => 'TEST-' . time(),
        'type' => 'IPD',
        'status' => 'ACTIVE',
        'attending_physician_id' => $physician->physician_code, // String
        'chief_complaint' => 'Test admission complaint',
        'priority' => 'NORMAL',
        'admission_datetime' => Carbon::now(),
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    echo "✅ Encounter created with ID: $encounterId\n";

    // Test 2: Create bed assignment
    echo "2. Testing bed assignment:\n";
    $bedAssignmentId = DB::table('bed_assignments')->insertGetId([
        'encounter_id' => $encounterId,
        'bed_id' => $bed->id,
        'assigned_at' => Carbon::now(),
        'assigned_by' => 'Test System',
        'assignment_notes' => 'Test assignment',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    echo "✅ Bed assignment created with ID: $bedAssignmentId\n";

    // Test 3: Create diagnosis (with required icd10_code)
    echo "3. Testing diagnosis creation:\n";
    $diagnosisId = DB::table('diagnoses')->insertGetId([
        'encounter_id' => $encounterId,
        'type' => 'PRIMARY',
        'icd10_code' => 'Z00.0', // Required field
        'description' => 'Test diagnosis',
        'diagnosed_by' => $physician->physician_code, // String
        'diagnosed_at' => Carbon::now(),
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    echo "✅ Diagnosis created with ID: $diagnosisId\n";

    // Test 4: Update bed status
    echo "4. Testing bed status update:\n";
    DB::table('beds')->where('id', $bed->id)->update([
        'status' => 'occupied',
        'updated_at' => Carbon::now(),
    ]);
    echo "✅ Bed status updated to occupied\n";

    echo "\n✅ All tests passed! The corrected logic should work.\n";

    DB::rollBack(); // Don't save test data
    echo "✅ Test transaction rolled back\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ Test failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nDone!\n";