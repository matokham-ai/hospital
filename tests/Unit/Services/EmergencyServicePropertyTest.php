<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\EmergencyService;
use App\Models\EmergencyPatient;
use App\Models\TriageAssessment;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Property-Based Tests for EmergencyService
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class EmergencyServicePropertyTest extends TestCase
{
    use RefreshDatabase;

    protected EmergencyService $emergencyService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->emergencyService = new EmergencyService();
    }

    /**
     * **Feature: consultation-enhancement, Property 1: Emergency indicator presence**
     * 
     * Property: For any consultation opened for a patient with an active emergency record,
     * the consultation data should include an emergency indicator flag set to true
     * 
     * **Validates: Requirements 1.1**
     * 
     * @test
     */
    public function property_emergency_indicator_presence_for_active_emergency_patients()
    {
        // Run property test with 10 iterations for faster execution
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient with active emergency record
            $patient = Patient::factory()->create();
            $emergencyPatient = EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomActiveStatus(),
                'chief_complaint' => $this->randomChiefComplaint(),
                'arrival_mode' => $this->randomArrivalMode(),
            ]);

            // Property: Emergency data should be retrieved for active emergency patients
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($patient->id);
            
            $this->assertNotNull(
                $emergencyData,
                "Property violated: Patient {$patient->id} with active emergency record should have emergency data"
            );
            
            $this->assertEquals(
                $emergencyPatient->id,
                $emergencyData->id,
                "Property violated: Retrieved emergency data should match the patient's emergency record"
            );
            
            $this->assertTrue(
                $this->emergencyService->isEmergencyPatient($patient->id),
                "Property violated: isEmergencyPatient should return true for patients with active emergency records"
            );
        }
    }

    /**
     * Property: For any patient without an active emergency record,
     * emergency data retrieval should return null
     * 
     * @test
     */
    public function property_no_emergency_indicator_for_non_emergency_patients()
    {
        // Run property test with 10 iterations
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient without emergency record
            $patient = Patient::factory()->create();

            // Property: No emergency data for non-emergency patients
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($patient->id);
            
            $this->assertNull(
                $emergencyData,
                "Property violated: Patient {$patient->id} without emergency record should have null emergency data"
            );
            
            $this->assertFalse(
                $this->emergencyService->isEmergencyPatient($patient->id),
                "Property violated: isEmergencyPatient should return false for patients without emergency records"
            );
        }
    }

    /**
     * Property: For any patient with a discharged emergency record,
     * emergency data retrieval should return null (not active)
     * 
     * @test
     */
    public function property_no_emergency_indicator_for_discharged_emergency_patients()
    {
        // Run property test with 10 iterations
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient with discharged emergency record
            $patient = Patient::factory()->create();
            EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => 'discharged',
            ]);

            // Property: Discharged emergency patients should not be considered active
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($patient->id);
            
            $this->assertNull(
                $emergencyData,
                "Property violated: Patient {$patient->id} with discharged emergency record should have null emergency data"
            );
            
            $this->assertFalse(
                $this->emergencyService->isEmergencyPatient($patient->id),
                "Property violated: isEmergencyPatient should return false for discharged emergency patients"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 2: Triage priority display**
     * 
     * Property: For any emergency patient with a triage assessment,
     * the consultation data should include the triage priority level from the assessment
     * 
     * **Validates: Requirements 1.2**
     * 
     * @test
     */
    public function property_triage_priority_display_for_emergency_patients_with_triage()
    {
        // Run property test with 10 iterations
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient with emergency record and triage assessment
            $patient = Patient::factory()->create();
            $emergencyPatient = EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomActiveStatus(),
            ]);
            
            $triageCategory = $this->randomTriageCategory();
            $triageAssessment = TriageAssessment::factory()->create([
                'emergency_patient_id' => $emergencyPatient->id,
                'triage_category' => $triageCategory,
                'assessed_at' => now()->subMinutes(rand(1, 60)),
            ]);

            // Property: Emergency data should include triage assessment with priority level
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($patient->id);
            
            $this->assertNotNull(
                $emergencyData,
                "Property violated: Emergency data should exist for patient with triage"
            );
            
            // Load the relationship
            $emergencyData->load('latestTriage');
            
            $this->assertNotNull(
                $emergencyData->latestTriage,
                "Property violated: Emergency data should include latest triage assessment"
            );
            
            $this->assertEquals(
                $triageCategory,
                $emergencyData->latestTriage->triage_category,
                "Property violated: Triage priority level should match the assessment"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 3: Emergency chief complaint inclusion**
     * 
     * Property: For any emergency patient, the consultation data should include
     * the chief complaint from the emergency registration
     * 
     * **Validates: Requirements 1.3**
     * 
     * @test
     */
    public function property_emergency_chief_complaint_inclusion()
    {
        // Run property test with 10 iterations
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient with emergency record
            $patient = Patient::factory()->create();
            $chiefComplaint = $this->randomChiefComplaint();
            $emergencyPatient = EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomActiveStatus(),
                'chief_complaint' => $chiefComplaint,
            ]);

            // Property: Emergency data should include chief complaint
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($patient->id);
            
            $this->assertNotNull(
                $emergencyData,
                "Property violated: Emergency data should exist"
            );
            
            $this->assertEquals(
                $chiefComplaint,
                $emergencyData->chief_complaint,
                "Property violated: Chief complaint should match emergency registration"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 4: Emergency arrival information**
     * 
     * Property: For any emergency patient, the consultation context should include
     * both arrival time and mode of arrival
     * 
     * **Validates: Requirements 1.4**
     * 
     * @test
     */
    public function property_emergency_arrival_information_inclusion()
    {
        // Run property test with 10 iterations
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient with emergency record
            $patient = Patient::factory()->create();
            $arrivalMode = $this->randomArrivalMode();
            $arrivalTime = now()->subHours(rand(1, 12));
            
            $emergencyPatient = EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomActiveStatus(),
                'arrival_mode' => $arrivalMode,
                'arrival_time' => $arrivalTime,
            ]);

            // Property: Emergency data should include arrival information
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($patient->id);
            
            $this->assertNotNull(
                $emergencyData,
                "Property violated: Emergency data should exist"
            );
            
            $this->assertNotNull(
                $emergencyData->arrival_mode,
                "Property violated: Arrival mode should be included"
            );
            
            $this->assertEquals(
                $arrivalMode,
                $emergencyData->arrival_mode,
                "Property violated: Arrival mode should match emergency registration"
            );
            
            $this->assertNotNull(
                $emergencyData->arrival_time,
                "Property violated: Arrival time should be included"
            );
            
            $this->assertEquals(
                $arrivalTime->format('Y-m-d H:i:s'),
                $emergencyData->arrival_time->format('Y-m-d H:i:s'),
                "Property violated: Arrival time should match emergency registration"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 5: Triage vitals availability**
     * 
     * Property: For any patient with a triage assessment, the consultation data
     * should include the triage vital signs when the assessment exists
     * 
     * **Validates: Requirements 1.5**
     * 
     * @test
     */
    public function property_triage_vitals_availability()
    {
        // Run property test with 10 iterations
        for ($i = 0; $i < 10; $i++) {
            // Generate random patient with emergency record and triage assessment
            $patient = Patient::factory()->create();
            $emergencyPatient = EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomActiveStatus(),
            ]);
            
            $vitals = $this->randomVitals();
            $triageAssessment = TriageAssessment::factory()->create([
                'emergency_patient_id' => $emergencyPatient->id,
                'temperature' => $vitals['temperature'],
                'blood_pressure' => $vitals['blood_pressure'],
                'heart_rate' => $vitals['heart_rate'],
                'respiratory_rate' => $vitals['respiratory_rate'],
                'oxygen_saturation' => $vitals['oxygen_saturation'],
                'assessed_at' => now()->subMinutes(rand(1, 60)),
            ]);

            // Property: Latest triage assessment should include vital signs
            $latestTriage = $this->emergencyService->getLatestTriageAssessment($emergencyPatient->id);
            
            $this->assertNotNull(
                $latestTriage,
                "Property violated: Latest triage assessment should exist"
            );
            
            $this->assertNotNull(
                $latestTriage->temperature,
                "Property violated: Temperature should be included in triage vitals"
            );
            
            $this->assertNotNull(
                $latestTriage->blood_pressure,
                "Property violated: Blood pressure should be included in triage vitals"
            );
            
            $this->assertNotNull(
                $latestTriage->heart_rate,
                "Property violated: Heart rate should be included in triage vitals"
            );
            
            $this->assertNotNull(
                $latestTriage->respiratory_rate,
                "Property violated: Respiratory rate should be included in triage vitals"
            );
            
            $this->assertNotNull(
                $latestTriage->oxygen_saturation,
                "Property violated: Oxygen saturation should be included in triage vitals"
            );
        }
    }

    /**
     * Property: For any emergency patient with multiple triage assessments,
     * getLatestTriageAssessment should return the most recent one
     * 
     * @test
     */
    public function property_latest_triage_assessment_returns_most_recent()
    {
        // Run property test with 5 iterations (fewer since we create multiple assessments)
        for ($i = 0; $i < 5; $i++) {
            // Generate random patient with emergency record
            $patient = Patient::factory()->create();
            $emergencyPatient = EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomActiveStatus(),
            ]);
            
            // Create multiple triage assessments at different times
            $assessmentCount = rand(2, 5);
            $assessments = [];
            for ($j = 0; $j < $assessmentCount; $j++) {
                $assessments[] = TriageAssessment::factory()->create([
                    'emergency_patient_id' => $emergencyPatient->id,
                    'assessed_at' => now()->subMinutes(($assessmentCount - $j) * 10),
                ]);
            }
            
            // The last assessment should be the most recent
            $expectedLatest = end($assessments);

            // Property: Latest triage should be the most recent assessment
            $latestTriage = $this->emergencyService->getLatestTriageAssessment($emergencyPatient->id);
            
            $this->assertNotNull(
                $latestTriage,
                "Property violated: Latest triage assessment should exist"
            );
            
            $this->assertEquals(
                $expectedLatest->id,
                $latestTriage->id,
                "Property violated: getLatestTriageAssessment should return the most recent assessment"
            );
        }
    }

    // Helper methods for generating random test data

    private function randomActiveStatus(): string
    {
        $statuses = ['waiting', 'in_treatment', 'observation', 'admitted'];
        return $statuses[array_rand($statuses)];
    }

    private function randomChiefComplaint(): string
    {
        $complaints = [
            'Chest pain',
            'Difficulty breathing',
            'Severe headache',
            'Abdominal pain',
            'Fever',
            'Trauma',
            'Laceration',
            'Fracture',
            'Allergic reaction',
            'Seizure',
        ];
        return $complaints[array_rand($complaints)];
    }

    private function randomArrivalMode(): string
    {
        $modes = ['ambulance', 'walk-in', 'police', 'helicopter', 'private_vehicle'];
        return $modes[array_rand($modes)];
    }

    private function randomTriageCategory(): string
    {
        $categories = ['red', 'yellow', 'green', 'black'];
        return $categories[array_rand($categories)];
    }

    private function randomVitals(): array
    {
        return [
            'temperature' => rand(350, 410) / 10, // 35.0 to 41.0
            'blood_pressure' => rand(90, 180) . '/' . rand(60, 120),
            'heart_rate' => rand(50, 150),
            'respiratory_rate' => rand(12, 30),
            'oxygen_saturation' => rand(85, 100),
        ];
    }
}
