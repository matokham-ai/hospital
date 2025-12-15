DB::commit();<?php
/**
 * Standalone Laravel debug script for testing the Admission insert process.
 * Run with: php debug_admission_test.php
 */

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== 🧪 Debugging Admission Database Flow ===\n\n";

// 1️⃣ Check core tables
$tables = ['patients', 'physicians', 'beds', 'encounters', 'bed_assignments', 'diagnoses'];

echo "1️⃣ Checking table structures...\n";
foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        echo "✅ Table '$table' exists\n";
        $columns = DB::select("DESCRIBE $table");

        foreach ($columns as $col) {
            if (preg_match('/id|code|patient|physician|bed|encounter|diagnosis|type|status/i', $col->Field)) {
                echo "   • {$col->Field}: {$col->Type} (Null: {$col->Null}, Default: {$col->Default})\n";
            }
        }
    } else {
        echo "❌ Table '$table' does not exist\n";
    }
    echo "\n";
}

// 2️⃣ Check sample data
echo "2️⃣ Checking sample data in key tables...\n";

function sample($table, $where = null) {
    if (!Schema::hasTable($table)) return null;
    return $where
        ? DB::table($table)->where($where)->first()
        : DB::table($table)->first();
}

$patient = sample('patients');
$bed = sample('beds', ['status' => 'available']) ?? sample('beds');
$doctor = sample('physicians');

if ($patient) echo "✅ Found patient: {$patient->id} ({$patient->first_name} {$patient->last_name})\n";
else echo "⚠️ No patient found. Insert at least one.\n";

if ($bed) echo "✅ Found bed: ID {$bed->id} ({$bed->bed_number}, status: {$bed->status})\n";
else echo "⚠️ No bed found.\n";

if ($doctor) echo "✅ Found physician: {$doctor->physician_code} ({$doctor->name})\n";
else echo "⚠️ No physician found.\n";

if (!$patient || !$bed || !$doctor) {
    echo "\n🚫 Missing required sample data. Please ensure at least 1 patient, bed, and physician exist.\n";
    exit;
}

// 3️⃣ Simulate admission transaction
echo "\n3️⃣ Testing simulated admission insert...\n";

try {
    DB::beginTransaction();

    // Encounter insert
    $encounter = [
        'patient_id' => $patient->id,
        'encounter_number' => 'ADM-' . time(),
        'type' => 'IPD',
        'status' => 'ACTIVE',
        'attending_physician_id' => $doctor->physician_code,
        'chief_complaint' => 'Test complaint - chest pain',
        'priority' => 'routine',
        'admission_datetime' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ];

    echo "\n→ Attempting encounter insert:\n";
    print_r($encounter);

    $encounterId = DB::table('encounters')->insertGetId($encounter);
    echo "✅ Encounter created with ID: $encounterId\n";

    // Bed assignment
    if (Schema::hasTable('bed_assignments')) {
        $bedAssign = [
            'encounter_id' => $encounterId,
            'bed_id' => $bed->id,
            'assigned_by'=>'Sys Admin',
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        DB::table('bed_assignments')->insert($bedAssign);
        echo "✅ Bed assigned (Bed ID {$bed->id})\n";
    }


    // Bed status
    if (Schema::hasTable('bed')) {
        $bedAssign = [

            'status' => 'occupied',
            'updated_at' => now(),
        ];
        DB::table('bed')->insert($bedAssign);
        echo "✅ Bed status updated";
    }

    // Diagnosis insert (if table exists)
    if (Schema::hasTable('diagnoses')) {
        $diag = [
            'encounter_id' => $encounterId,
            'icd10_code' => 'I20',
            'description' => 'Angina pectoris — chest pain',
            'type' => 'primary',
            'diagnosed_by' => $doctor->physician_code,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        DB::table('diagnoses')->insert($diag);
        echo "✅ Diagnosis inserted (ICD10 I20)\n";
    }

    /*DB::rollBack();
    echo "\n✅ Transaction rolled back — no data permanently saved.\n";*/
DB::commit();
echo "✅ Transaction committed — test admission permanently saved.\n";


} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ Insert failed: {$e->getMessage()}\n";
    echo "Error Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🎯 Done.\n";
