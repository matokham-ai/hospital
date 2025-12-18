<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Encounter;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\Department;
use App\Models\VitalSign;
use App\Models\ClinicalNote;
use App\Models\Diagnosis;
use App\Models\LabOrder;
use App\Models\LabResult;
use Carbon\Carbon;

class ComprehensiveMedicalRecordsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🏥 Seeding comprehensive medical records...');

        $patients = Patient::limit(50)->get(); // limit for testing
        $physicians = Physician::all();
        $departments = Department::all();

        if ($patients->isEmpty() || $physicians->isEmpty() || $departments->isEmpty()) {
            $this->command->error('❌ Seed patients, physicians, and departments first.');
            return;
        }

        DB::transaction(function () use ($patients, $physicians, $departments) {
            $encounterCount = 0;
            
            foreach ($patients as $patient) {
                for ($i = 0; $i < rand(2, 3); $i++) {
                    $encounter = $this->createEncounter($patient, $physicians, $departments);
                    $this->createVitalSigns($encounter);
                    $this->createClinicalNotes($encounter, $physicians);
                    $this->createDiagnoses($encounter);
                    $this->createLabOrdersAndResults($encounter);
                    
                    $encounterCount++;
                    
                    if ($encounterCount % 50 === 0) {
                        $this->command->info("   Seeded {$encounterCount} encounters...");
                    }
                }
            }
            
            $this->command->info("✅ Seeded {$encounterCount} encounters with comprehensive data!");
        });

        $this->command->info('✅ Seeding complete!');
    }

    private function createEncounter($patient, $physicians, $departments)
    {
        $physician = $physicians->random();
        $department = $departments->random();
        $encounterDate = Carbon::now()->subDays(rand(1, 180));
        
        $encounterTypes = ['OPD', 'IPD', 'EMERGENCY'];
        $statuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
        
        return Encounter::create([
            'patient_id' => $patient->id,
            'encounter_number' => 'ENC-' . time() . rand(1000, 9999),
            'type' => $encounterTypes[array_rand($encounterTypes)],
            'status' => $statuses[array_rand($statuses)],
            'department_id' => $department->deptid,
            'attending_physician_id' => $physician->physician_code,
            'chief_complaint' => $this->getRandomChiefComplaint(),
            'admission_datetime' => $encounterDate,
            'discharge_datetime' => rand(0, 1) ? $encounterDate->copy()->addHours(rand(2, 72)) : null,
        ]);
    }

    private function createVitalSigns($encounter)
    {
        $vitalSets = rand(2, 4);
        
        for ($i = 0; $i < $vitalSets; $i++) {
            VitalSign::create([
                'encounter_id' => $encounter->id,
                'temperature' => round(rand(970, 1040) / 10, 1), // 97.0 - 104.0°F
                'systolic_bp' => rand(90, 180),
                'diastolic_bp' => rand(60, 110),
                'heart_rate' => rand(60, 120),
                'respiratory_rate' => rand(12, 24),
                'oxygen_saturation' => rand(92, 100),
                'recorded_at' => $encounter->admission_datetime->addHours($i * 6),
                'recorded_by' => 'Nurse ' . ['Johnson', 'Smith', 'Williams', 'Brown'][array_rand(['Johnson', 'Smith', 'Williams', 'Brown'])],
            ]);
        }
    }

    private function createClinicalNotes($encounter, $physicians)
    {
        $noteTypes = ['SOAP', 'PROGRESS', 'DISCHARGE', 'CONSULTATION'];
        $numNotes = rand(1, 3);
        
        for ($i = 0; $i < $numNotes; $i++) {
            ClinicalNote::create([
                'encounter_id' => $encounter->id,
                'note_type' => $noteTypes[array_rand($noteTypes)],
                'content' => $this->getRandomClinicalNote($encounter->chief_complaint),
                'created_by' => $physicians->random()->physician_code,
                'note_datetime' => $encounter->admission_datetime->addHours(rand(1, 48)),
            ]);
        }
    }

    private function createDiagnoses($encounter)
    {
        $diagnoses = $this->getRandomDiagnoses();
        $numDiagnoses = rand(1, 2);
        
        for ($i = 0; $i < $numDiagnoses; $i++) {
            Diagnosis::create([
                'encounter_id' => $encounter->id,
                'icd10_code' => 'ICD-' . rand(100, 999) . '.' . rand(10, 99),
                'description' => $diagnoses[array_rand($diagnoses)],
                'type' => ['Primary', 'Secondary'][array_rand(['Primary', 'Secondary'])],
                'diagnosed_by' => $encounter->attending_physician_id,
                'diagnosed_at' => $encounter->admission_datetime->addHours(rand(1, 24)),
            ]);
        }
    }

    private function createLabOrdersAndResults($encounter)
    {
        $labTests = [
            'Complete Blood Count (CBC)' => ['WBC' => '4.5-11.0 K/uL', 'RBC' => '4.2-5.4 M/uL', 'Hemoglobin' => '12.0-15.5 g/dL'],
            'Basic Metabolic Panel' => ['Glucose' => '70-100 mg/dL', 'Sodium' => '136-145 mEq/L', 'Potassium' => '3.5-5.0 mEq/L'],
            'Lipid Panel' => ['Total Cholesterol' => '<200 mg/dL', 'HDL' => '>40 mg/dL', 'LDL' => '<100 mg/dL'],
            'Liver Function Tests' => ['ALT' => '7-56 U/L', 'AST' => '10-40 U/L', 'Bilirubin' => '0.3-1.2 mg/dL'],
            'Thyroid Function' => ['TSH' => '0.4-4.0 mIU/L', 'T4' => '4.5-12.0 ug/dL'],
        ];

        $numTests = rand(2, 3);
        $testNames = array_keys($labTests);
        $selectedTestNames = array_slice($testNames, 0, $numTests);

        foreach ($selectedTestNames as $testName) {
            $testComponents = $labTests[$testName];
            
            $labOrder = LabOrder::create([
                'encounter_id' => $encounter->id,
                'patient_id' => $encounter->patient_id,
                'test_name' => $testName,
                'ordered_by' => $encounter->attending_physician_id,
                'status' => 'completed',
            ]);

            // Create results for each component
            foreach ($testComponents as $component => $normalRange) {
                $this->createLabResult($labOrder, $component, $normalRange);
            }
        }
    }

    private function createLabResult($labOrder, $component, $normalRange)
    {
        // Generate realistic values
        $resultValue = $this->generateLabValue($component, $normalRange);
        $isAbnormal = $this->isValueAbnormal($resultValue, $normalRange);
        
        LabResult::create([
            'lab_order_id' => $labOrder->id,
            'parameter_name' => $component,
            'value' => $resultValue,
            'reference_range' => $normalRange,
            'status' => $isAbnormal ? ($this->isCritical() ? 'critical' : 'abnormal') : 'normal',
        ]);
    }

    private function generateLabValue($component, $normalRange)
    {
        // Simple value generation based on component type
        switch ($component) {
            case 'WBC':
                return round(rand(35, 150) / 10, 1); // 3.5-15.0
            case 'RBC':
                return round(rand(38, 60) / 10, 1); // 3.8-6.0
            case 'Hemoglobin':
                return round(rand(100, 180) / 10, 1); // 10.0-18.0
            case 'Glucose':
                return rand(65, 140);
            case 'Sodium':
                return rand(130, 150);
            case 'Potassium':
                return round(rand(30, 55) / 10, 1); // 3.0-5.5
            case 'Total Cholesterol':
                return rand(150, 280);
            case 'HDL':
                return rand(25, 80);
            case 'LDL':
                return rand(70, 180);
            case 'ALT':
                return rand(5, 80);
            case 'AST':
                return rand(8, 60);
            case 'Bilirubin':
                return round(rand(2, 20) / 10, 1); // 0.2-2.0
            case 'TSH':
                return round(rand(2, 80) / 10, 1); // 0.2-8.0
            case 'T4':
                return round(rand(30, 150) / 10, 1); // 3.0-15.0
            default:
                return rand(50, 150);
        }
    }

    private function isValueAbnormal($value, $normalRange)
    {
        return rand(0, 100) < 25; // 25% chance of abnormal
    }

    private function isCritical()
    {
        return rand(0, 100) < 10; // 10% chance of critical if abnormal
    }

    private function getRandomChiefComplaint()
    {
        $complaints = [
            'Chest pain and shortness of breath',
            'Severe headache with nausea',
            'Abdominal pain and vomiting',
            'High fever and chills',
            'Persistent cough with blood',
            'Severe back pain radiating to leg',
            'Dizziness and fainting episodes',
            'Joint pain and swelling',
            'Skin rash with itching',
            'Difficulty breathing at night',
            'Chronic fatigue and weakness',
            'Severe anxiety and panic attacks',
            'Memory loss and confusion',
            'Unexplained weight loss',
            'Frequent urination and thirst',
        ];
        
        return $complaints[array_rand($complaints)];
    }

    private function getRandomClinicalNote($chiefComplaint)
    {
        $templates = [
            "Patient presents with {$chiefComplaint}. Physical examination reveals stable vital signs. Patient appears comfortable and alert. Plan to continue monitoring and supportive care.",
            "Admitted for {$chiefComplaint}. Initial assessment shows patient is stable. Laboratory results pending. Will reassess in 4 hours and adjust treatment plan accordingly.",
            "Progress note: Patient showing improvement since admission for {$chiefComplaint}. Vital signs stable. Patient reports decreased pain/discomfort. Continue current treatment regimen.",
            "Consultation note: Evaluated patient for {$chiefComplaint}. Recommend additional diagnostic workup including imaging studies. Patient counseled on treatment options.",
            "Discharge note: Patient stable for discharge following treatment for {$chiefComplaint}. Provided discharge instructions and follow-up appointments scheduled.",
        ];
        
        return $templates[array_rand($templates)];
    }

    private function getRandomDiagnoses()
    {
        return [
            'Hypertension, essential',
            'Type 2 diabetes mellitus',
            'Acute myocardial infarction',
            'Pneumonia, unspecified organism',
            'Chronic obstructive pulmonary disease',
            'Gastroesophageal reflux disease',
            'Acute appendicitis',
            'Migraine headache',
            'Osteoarthritis of knee',
            'Depression, major depressive disorder',
            'Anxiety disorder, generalized',
            'Urinary tract infection',
            'Acute bronchitis',
            'Allergic rhinitis',
            'Hyperlipidemia',
            'Chronic kidney disease',
            'Atrial fibrillation',
            'Stroke, acute ischemic',
            'Cellulitis of lower limb',
            'Fracture of wrist',
        ];
    }
}