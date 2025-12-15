<?php

namespace App\Services;

use App\Models\EmergencyPatient;
use App\Models\TriageAssessment;

class EmergencyService
{
    /**
     * Get emergency data for a patient
     * 
     * @param int|string $patientId
     * @return EmergencyPatient|null
     */
    public function getEmergencyDataForPatient(int|string $patientId): ?EmergencyPatient
    {
        return EmergencyPatient::with(['latestTriage', 'assignedDoctor'])
            ->where('patient_id', $patientId)
            ->where('status', '!=', 'discharged')
            ->first();
    }

    /**
     * Get the latest triage assessment for an emergency patient
     * 
     * @param int $emergencyPatientId
     * @return TriageAssessment|null
     */
    public function getLatestTriageAssessment(int $emergencyPatientId): ?TriageAssessment
    {
        return TriageAssessment::where('emergency_patient_id', $emergencyPatientId)
            ->latest('assessed_at')
            ->first();
    }

    /**
     * Check if a patient is an emergency patient
     * 
     * @param int|string $patientId
     * @return bool
     */
    public function isEmergencyPatient(int|string $patientId): bool
    {
        return EmergencyPatient::where('patient_id', $patientId)
            ->where('status', '!=', 'discharged')
            ->exists();
    }
}
