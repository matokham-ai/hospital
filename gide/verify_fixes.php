<?php
/**
 * Verification Script for Patient Registration & Inpatient Fixes
 * Run: php verify_fixes.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;

echo "=== Patient Registration & Inpatient System Verification ===\n\n";

$allPassed = true;

// Test 1: Session Configuration
echo "1. Checking Session Configuration...\n";
$sessionLifetime = Config::get('session.lifetime');
if ($sessionLifetime >= 720) {
    echo "   ✅ Session lifetime: {$sessionLifetime} minutes (12+ hours)\n";
} else {
    echo "   ❌ Session lifetime: {$sessionLifetime} minutes (should be 720+)\n";
    $allPassed = false;
}

// Test 2: ICD10 Column in Encounters
echo "\n2. Checking encounters table for icd10_code column...\n";
if (Schema::hasColumn('encounters', 'icd10_code')) {
    echo "   ✅ icd10_code column exists in encounters table\n";
} else {
    echo "   ❌ icd10_code column missing from encounters table\n";
    $allPassed = false;
}

// Test 3: Doctor Rounds Table
echo "\n3. Checking doctor_rounds table...\n";
if (Schema::hasTable('doctor_rounds')) {
    $roundsCount = DB::table('doctor_rounds')->count();
    echo "   ✅ doctor_rounds table exists ({$roundsCount} records)\n";
} else {
    echo "   ❌ doctor_rounds table missing\n";
    $allPassed = false;
}

// Test 4: Diagnoses with ICD10 Codes
echo "\n4. Checking diagnoses with ICD10 codes...\n";
$diagnosesWithICD10 = DB::table('diagnoses')
    ->whereNotNull('icd10_code')
    ->count();
echo "   ℹ️  Found {$diagnosesWithICD10} diagnoses with ICD10 codes\n";

// Test 5: Active Inpatients with Diagnoses
echo "\n5. Checking active inpatients with diagnoses...\n";
$activeWithDiagnosis = DB::table('encounters')
    ->join('bed_assignments', 'encounters.id', '=', 'bed_assignments.encounter_id')
    ->leftJoin('diagnoses', function($join) {
        $join->on('encounters.id', '=', 'diagnoses.encounter_id')
            ->where('diagnoses.type', '=', 'PRIMARY');
    })
    ->where('encounters.type', 'IPD')
    ->where('encounters.status', 'ACTIVE')
    ->whereNull('bed_assignments.released_at')
    ->select(
        'encounters.id',
        'encounters.patient_id',
        'diagnoses.icd10_code',
        'diagnoses.description'
    )
    ->get();

echo "   ℹ️  Active inpatients: {$activeWithDiagnosis->count()}\n";
$withDiagnosis = $activeWithDiagnosis->filter(fn($p) => !empty($p->icd10_code))->count();
echo "   ℹ️  With ICD10 diagnosis: {$withDiagnosis}\n";

// Test 6: Session Table
echo "\n6. Checking sessions table...\n";
if (Schema::hasTable('sessions')) {
    $activeSessions = DB::table('sessions')->count();
    echo "   ✅ sessions table exists ({$activeSessions} active sessions)\n";
} else {
    echo "   ❌ sessions table missing\n";
    $allPassed = false;
}

// Test 7: Middleware Files
echo "\n7. Checking middleware files...\n";
$middlewareFiles = [
    'app/Http/Middleware/HandleInertiaRequests.php',
    'app/Http/Middleware/TrackSessionActivity.php',
];

foreach ($middlewareFiles as $file) {
    if (file_exists($file)) {
        echo "   ✅ {$file}\n";
    } else {
        echo "   ❌ {$file} missing\n";
        $allPassed = false;
    }
}

// Test 8: Frontend Components
echo "\n8. Checking frontend components...\n";
$frontendFiles = [
    'resources/js/Components/SessionWarning.tsx',
    'resources/js/Pages/Inpatient/InpatientDashboard.tsx',
];

foreach ($frontendFiles as $file) {
    if (file_exists($file)) {
        echo "   ✅ {$file}\n";
    } else {
        echo "   ❌ {$file} missing\n";
        $allPassed = false;
    }
}

// Test 9: Sample Diagnosis Query
echo "\n9. Testing diagnosis display query...\n";
try {
    $samplePatient = DB::table('encounters')
        ->join('patients', 'encounters.patient_id', '=', 'patients.id')
        ->join('bed_assignments', function ($join) {
            $join->on('encounters.id', '=', 'bed_assignments.encounter_id')
                ->whereNull('bed_assignments.released_at');
        })
        ->leftJoin('diagnoses', function ($join) {
            $join->on('encounters.id', '=', 'diagnoses.encounter_id')
                ->where('diagnoses.type', '=', 'PRIMARY');
        })
        ->leftJoin('icd10_codes', 'diagnoses.icd10_code', '=', 'icd10_codes.code')
        ->where('encounters.type', 'IPD')
        ->where('encounters.status', 'ACTIVE')
        ->select(
            'patients.first_name',
            'patients.last_name',
            'encounters.chief_complaint',
            'diagnoses.icd10_code',
            'diagnoses.description as diagnosis_description',
            'icd10_codes.description as icd10_description'
        )
        ->first();
    
    if ($samplePatient) {
        $diagnosis = $samplePatient->icd10_description 
            ?? $samplePatient->diagnosis_description 
            ?? $samplePatient->chief_complaint 
            ?? 'Not specified';
        
        if ($samplePatient->icd10_code) {
            $diagnosis = "[{$samplePatient->icd10_code}] {$diagnosis}";
        }
        
        echo "   ✅ Query successful\n";
        echo "   ℹ️  Sample: {$samplePatient->first_name} {$samplePatient->last_name}\n";
        echo "   ℹ️  Diagnosis: {$diagnosis}\n";
    } else {
        echo "   ℹ️  No active inpatients to test with\n";
    }
} catch (\Exception $e) {
    echo "   ❌ Query failed: {$e->getMessage()}\n";
    $allPassed = false;
}

// Test 10: Doctor Rounds Query
echo "\n10. Testing doctor rounds query...\n";
try {
    $todayRounds = DB::table('doctor_rounds')
        ->whereDate('round_date', now())
        ->count();
    echo "   ✅ Rounds query successful\n";
    echo "   ℹ️  Today's rounds: {$todayRounds}\n";
} catch (\Exception $e) {
    echo "   ❌ Rounds query failed: {$e->getMessage()}\n";
    $allPassed = false;
}

// Summary
echo "\n" . str_repeat("=", 60) . "\n";
if ($allPassed) {
    echo "✅ ALL CHECKS PASSED - System is ready!\n";
} else {
    echo "❌ SOME CHECKS FAILED - Please review errors above\n";
}
echo str_repeat("=", 60) . "\n\n";

echo "Next Steps:\n";
echo "1. Test patient registration (should not timeout)\n";
echo "2. Verify diagnosis display on inpatient dashboard\n";
echo "3. Check doctor rounds visibility (for doctor users)\n";
echo "4. Test concurrent bed assignments\n";
echo "5. Monitor session warnings (10 min before expiry)\n\n";

exit($allPassed ? 0 : 1);
