/**
 * EmergencyStatusBadge Usage Examples
 * 
 * This file demonstrates how to use the EmergencyStatusBadge component
 * in different scenarios within the consultation workflow.
 */

import EmergencyStatusBadge from './EmergencyStatusBadge';
import { EmergencyPatient, TriageAssessment } from '@/types';

// Example 1: Critical Emergency Patient with Full Triage Data
export function CriticalEmergencyExample() {
    const emergencyData: EmergencyPatient = {
        id: 1,
        patient_id: 123,
        chief_complaint: 'Severe chest pain radiating to left arm',
        arrival_mode: 'AMBULANCE',
        arrival_time: '2024-12-01T10:30:00Z',
        status: 'IN_TREATMENT',
        created_at: '2024-12-01T10:30:00Z',
        updated_at: '2024-12-01T10:30:00Z',
    };

    const triageAssessment: TriageAssessment = {
        id: 1,
        emergency_patient_id: 1,
        triage_category: 'CRITICAL',
        temperature: 38.5,
        blood_pressure: '140/90',
        heart_rate: 110,
        respiratory_rate: 22,
        oxygen_saturation: 95,
        gcs_total: 15,
        assessment_notes: 'Patient presenting with acute coronary syndrome symptoms',
        assessed_at: '2024-12-01T10:35:00Z',
        created_at: '2024-12-01T10:35:00Z',
        updated_at: '2024-12-01T10:35:00Z',
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Critical Emergency Patient</h3>
            <EmergencyStatusBadge
                emergencyData={emergencyData}
                triageAssessment={triageAssessment}
            />
        </div>
    );
}

// Example 2: Urgent Emergency Patient
export function UrgentEmergencyExample() {
    const emergencyData: EmergencyPatient = {
        id: 2,
        patient_id: 456,
        chief_complaint: 'High fever and difficulty breathing',
        arrival_mode: 'WALK_IN',
        arrival_time: '2024-12-01T11:00:00Z',
        status: 'WAITING',
        created_at: '2024-12-01T11:00:00Z',
        updated_at: '2024-12-01T11:00:00Z',
    };

    const triageAssessment: TriageAssessment = {
        id: 2,
        emergency_patient_id: 2,
        triage_category: 'URGENT',
        temperature: 39.2,
        blood_pressure: '130/85',
        heart_rate: 95,
        respiratory_rate: 24,
        oxygen_saturation: 92,
        assessed_at: '2024-12-01T11:05:00Z',
        created_at: '2024-12-01T11:05:00Z',
        updated_at: '2024-12-01T11:05:00Z',
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Urgent Emergency Patient</h3>
            <EmergencyStatusBadge
                emergencyData={emergencyData}
                triageAssessment={triageAssessment}
            />
        </div>
    );
}

// Example 3: Emergency Patient Without Triage Assessment
export function EmergencyWithoutTriageExample() {
    const emergencyData: EmergencyPatient = {
        id: 3,
        patient_id: 789,
        chief_complaint: 'Minor laceration requiring sutures',
        arrival_mode: 'PRIVATE_VEHICLE',
        arrival_time: '2024-12-01T12:00:00Z',
        status: 'WAITING',
        created_at: '2024-12-01T12:00:00Z',
        updated_at: '2024-12-01T12:00:00Z',
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Emergency Patient (No Triage Yet)</h3>
            <EmergencyStatusBadge emergencyData={emergencyData} />
        </div>
    );
}

// Example 4: Usage in Patient Header
export function PatientHeaderExample() {
    const emergencyData: EmergencyPatient = {
        id: 4,
        patient_id: 101,
        chief_complaint: 'Severe abdominal pain',
        arrival_mode: 'AMBULANCE',
        arrival_time: '2024-12-01T13:00:00Z',
        status: 'IN_TREATMENT',
        created_at: '2024-12-01T13:00:00Z',
        updated_at: '2024-12-01T13:00:00Z',
    };

    const triageAssessment: TriageAssessment = {
        id: 4,
        emergency_patient_id: 4,
        triage_category: 'URGENT',
        temperature: 37.8,
        blood_pressure: '135/88',
        heart_rate: 88,
        respiratory_rate: 18,
        oxygen_saturation: 98,
        gcs_total: 15,
        assessed_at: '2024-12-01T13:05:00Z',
        created_at: '2024-12-01T13:05:00Z',
        updated_at: '2024-12-01T13:05:00Z',
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">John Doe</h2>
                    <p className="text-gray-600">MRN: 12345 | Age: 45 | Male</p>
                </div>
                <EmergencyStatusBadge
                    emergencyData={emergencyData}
                    triageAssessment={triageAssessment}
                />
            </div>
            <div className="border-t pt-4">
                <p className="text-gray-700">Consultation in progress...</p>
            </div>
        </div>
    );
}

// Example 5: All Priority Levels Comparison
export function AllPriorityLevelsExample() {
    const baseEmergencyData: EmergencyPatient = {
        id: 5,
        patient_id: 202,
        chief_complaint: 'Various symptoms',
        arrival_mode: 'AMBULANCE',
        arrival_time: '2024-12-01T14:00:00Z',
        status: 'IN_TREATMENT',
        created_at: '2024-12-01T14:00:00Z',
        updated_at: '2024-12-01T14:00:00Z',
    };

    const priorities: Array<'CRITICAL' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT'> = [
        'CRITICAL',
        'URGENT',
        'SEMI_URGENT',
        'NON_URGENT',
    ];

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold mb-4">All Triage Priority Levels</h3>
            {priorities.map((priority) => {
                const triageAssessment: TriageAssessment = {
                    id: 5,
                    emergency_patient_id: 5,
                    triage_category: priority,
                    temperature: 37.5,
                    blood_pressure: '120/80',
                    heart_rate: 75,
                    respiratory_rate: 16,
                    oxygen_saturation: 98,
                    gcs_total: 15,
                    assessed_at: '2024-12-01T14:05:00Z',
                    created_at: '2024-12-01T14:05:00Z',
                    updated_at: '2024-12-01T14:05:00Z',
                };

                return (
                    <div key={priority} className="flex items-center gap-4">
                        <span className="w-32 text-sm font-medium text-gray-700">
                            {priority}:
                        </span>
                        <EmergencyStatusBadge
                            emergencyData={baseEmergencyData}
                            triageAssessment={triageAssessment}
                        />
                    </div>
                );
            })}
        </div>
    );
}
