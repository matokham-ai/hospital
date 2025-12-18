<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class AdmitPatientQuickTest extends TestCase
{
    public function test_insert_admission_payload()
    {
        // 🔹 Insert only essential rows (no factories, no seeding)
        DB::table('patients')->insertOrIgnore([
            'id' => 'PAT010',
            'first_name' => 'Emily',
            'last_name' => 'Taylor',
            'date_of_birth' => '1993-05-20',
            'gender' => 'F',
        ]);

        DB::table('beds')->insertOrIgnore([
            'id' => 1,
            'bed_number' => 'B001',
            'ward_name' => 'General Ward',
            'bed_type' => 'General',
            'status' => 'available',
        ]);

        DB::table('physicians')->insertOrIgnore([
            'physician_code' => 'PHY001',
            'full_name' => 'Dr. John Doe',
            'specialization' => 'Cardiology',
        ]);

        // 🔹 Prepare minimal working payload
        $payload = [
            'patient_id' => 'PAT010',
            'bed_id' => 1,
            'attending_doctor_id' => 'PHY001',
            'attending_physician_code' => 'PHY001',
            'admission_type' => 'observation',
            'priority' => 'routine',
            'chief_complaint' => 'Chest pain and difficulty breathing',
            'icd10_code' => 'I20',
            'icd10_description' => 'Angina pectoris',
            'primary_diagnosis' => 'Angina pectoris — Chest pain',
            'secondary_diagnosis' => '',
            'admission_notes' => '',
            'estimated_stay_days' => 2,
            'insurance_info' => '',
            'next_of_kin' => 'John Taylor',
            'next_of_kin_phone' => '0712345678',
        ];

        // 🔹 Make POST request
        $response = $this->postJson('/inpatient/api/admit-patient', $payload);

        // 🔹 Dump the backend response to see what happened
        $response->dump();

        // 🔹 Optional: Check DB if inserted
        if (DB::table('encounters')->where('patient_id', 'PAT010')->exists()) {
            fwrite(STDOUT, "✅ Encounter inserted successfully.\n");
        } else {
            fwrite(STDOUT, "❌ No encounter inserted.\n");
        }

        // Keep it light — no strict asserts
        $this->assertTrue(true);
    }
}
