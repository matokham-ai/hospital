<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Patient;
use Spatie\Permission\Models\Role;

class MedicationScheduleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('medication_schedules')->truncate();

        $medications = [
            ['name' => 'Paracetamol', 'dosage' => '500mg', 'route' => 'Oral'],
            ['name' => 'Ceftriaxone', 'dosage' => '1g', 'route' => 'IV'],
            ['name' => 'Metformin', 'dosage' => '850mg', 'route' => 'Oral'],
            ['name' => 'Furosemide', 'dosage' => '40mg', 'route' => 'IV'],
            ['name' => 'Insulin', 'dosage' => '10 units', 'route' => 'Subcutaneous'],
            ['name' => 'Amoxicillin', 'dosage' => '500mg', 'route' => 'Oral'],
            ['name' => 'Omeprazole', 'dosage' => '20mg', 'route' => 'Oral'],
        ];

        $timeSlots = ['06:00', '08:00', '12:00', '16:00', '20:00'];

        $patients = Patient::take(10)->get();

        // ✅ Handle role-based user lookup properly
        $nurseRole = Role::where('name', 'nurse')->first();
        $doctorRole = Role::where('name', 'doctor')->first();

        $nurseIds = $nurseRole
            ? DB::table('model_has_roles')->where('role_id', $nurseRole->id)->pluck('model_id')->toArray()
            : [];
        $doctorIds = $doctorRole
            ? DB::table('model_has_roles')->where('role_id', $doctorRole->id)->pluck('model_id')->toArray()
            : [];

        $nurseAndDoctorIds = array_merge($nurseIds, $doctorIds);

        if (empty($nurseAndDoctorIds)) {
            $this->command->warn("⚠️ No users found with 'nurse' or 'doctor' roles.");
        }

        if ($patients->isEmpty()) {
            $this->command->warn("⚠️ No patients found. Please seed the patients table first.");
            return;
        }

        foreach ($patients as $patient) {
            foreach ($timeSlots as $time) {
                $med = collect($medications)->random();
                $status = collect(['pending', 'due', 'given', 'missed'])->random();

                DB::table('medication_schedules')->insert([
                    'patient_id'      => $patient->id,
                    'medication'      => $med['name'],
                    'dosage'          => $med['dosage'],
                    'route'           => $med['route'],
                    'scheduled_time'  => $time,
                    'status'          => $status,
                    'administered_by' => $status === 'given' && !empty($nurseAndDoctorIds)
                        ? collect($nurseAndDoctorIds)->random()
                        : null,
                    'administered_at' => $status === 'given' ? now()->subMinutes(rand(10, 60)) : null,
                    'notes'           => $status === 'missed'
                        ? 'Patient unavailable during round.'
                        : null,
                    'barcode'         => strtoupper(Str::random(8)),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            }
        }

        $this->command->info("✅ Medication schedules seeded successfully for {$patients->count()} patients.");
    }
}
