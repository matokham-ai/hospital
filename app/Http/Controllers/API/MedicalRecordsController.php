<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Encounter;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MedicalRecordsController extends Controller
{
    /**
     * Get medical records with filtering and search
     */
    public function index(Request $request): JsonResponse
    {
        $query = Encounter::with([
            'patient',
            'physician',
            'department',
            'diagnoses',
            'vitalSigns' => function($q) {
                $q->latest()->first();
            },
            'clinicalNotes',
            'labOrders.results'
        ]);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->whereHas('patient', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            })->orWhereHas('diagnoses', function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%");
            });
        }

        // Filter by encounter type
        if ($request->filled('encounter_type')) {
            $query->where('type', $request->get('encounter_type'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('admission_datetime', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('admission_datetime', '<=', $request->get('date_to'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $perPage = $request->get('per_page', 20);
        $records = $query->orderBy('admission_datetime', 'desc')->paginate($perPage);

        // Transform the data
        $records->getCollection()->transform(function ($encounter) {
            return $this->transformMedicalRecord($encounter);
        });

        return response()->json($records);
    }

    /**
     * Get a specific medical record
     */
    public function show(Request $request, $id): JsonResponse
    {
        // Check if the ID looks like an encounter number (starts with ENC-)
        if (str_starts_with($id, 'ENC-')) {
            $encounter = Encounter::with([
                'patient.contacts',
                'physician',
                'department',
                'diagnoses',
                'vitalSigns',
                'clinicalNotes',
                'labOrders.results',
                'billingItems'
            ])->where('encounter_number', $id)->firstOrFail();
        } else {
            $encounter = Encounter::with([
                'patient.contacts',
                'physician',
                'department',
                'diagnoses',
                'vitalSigns',
                'clinicalNotes',
                'labOrders.results',
                'billingItems'
            ])->findOrFail($id);
        }

        return response()->json($this->transformMedicalRecordDetail($encounter));
    }

    /**
     * Transform encounter to medical record format
     */
    private function transformMedicalRecord($encounter)
    {
        $latestVitals = $encounter->vitalSigns->first();
        $diagnoses = $encounter->diagnoses->pluck('description')->toArray();
        
        return [
            'id' => $encounter->encounter_number ?? $encounter->id,
            'patientId' => $encounter->patient->id,
            'patientName' => $encounter->patient->name,
            'patientAge' => $encounter->patient->date_of_birth ? 
                \Carbon\Carbon::parse($encounter->patient->date_of_birth)->age : null,
            'patientGender' => $this->mapGender($encounter->patient->gender),
            'patientPhone' => $encounter->patient->contacts->first()?->phone_number ?? 'N/A',
            'encounterType' => $this->mapEncounterType($encounter->type),
            'visitDate' => $encounter->admission_datetime ? 
                \Carbon\Carbon::parse($encounter->admission_datetime)->format('Y-m-d') : null,
            'diagnosis' => implode(', ', $diagnoses) ?: 'No diagnosis recorded',
            'symptoms' => $this->extractSymptoms($encounter),
            'vitals' => $this->formatVitals($latestVitals),
            'labResults' => $this->formatLabResults($encounter->labOrders),
            'medications' => $this->formatMedications($encounter),
            'notes' => $encounter->clinicalNotes->first()?->notes ?? 'No notes available',
            'doctorName' => $encounter->physician?->name ?? 'Unknown',
            'department' => $encounter->department?->name ?? 'Unknown',
            'followUpDate' => null, // Would need additional model for follow-ups
            'status' => $this->mapStatus($encounter->status)
        ];
    }

    /**
     * Transform encounter to detailed medical record format
     */
    private function transformMedicalRecordDetail($encounter)
    {
        $record = $this->transformMedicalRecord($encounter);
        
        // Add additional details for the detailed view
        $record['allergies'] = $encounter->patient->allergies ?? [];
        $record['chronicConditions'] = $encounter->patient->chronic_conditions ?? [];
        $record['insuranceInfo'] = $encounter->patient->insurance_info ?? [];
        $record['allVitals'] = $encounter->vitalSigns->map(function($vital) {
            return $this->formatVitals($vital);
        });
        $record['allNotes'] = $encounter->clinicalNotes->map(function($note) {
            return [
                'date' => $note->created_at->format('Y-m-d H:i'),
                'notes' => $note->notes,
                'type' => $note->note_type ?? 'General'
            ];
        });

        return $record;
    }

    /**
     * Map encounter type to frontend format
     */
    private function mapEncounterType($type)
    {
        $mapping = [
            'OPD' => 'OPD',
            'IPD' => 'IPD',
            'EMERGENCY' => 'Emergency',
            'outpatient' => 'OPD',
            'inpatient' => 'IPD',
            'emergency' => 'Emergency'
        ];

        return $mapping[$type] ?? 'OPD';
    }

    /**
     * Map status to frontend format
     */
    private function mapStatus($status)
    {
        $mapping = [
            'ACTIVE' => 'Active',
            'COMPLETED' => 'Completed',
            'CANCELLED' => 'Cancelled',
            'active' => 'Active',
            'completed' => 'Completed',
            'discharged' => 'Completed',
            'pending' => 'Follow-up Required'
        ];

        return $mapping[$status] ?? 'Active';
    }

    /**
     * Extract symptoms from clinical notes or chief complaint
     */
    private function extractSymptoms($encounter)
    {
        $symptoms = [];
        
        if ($encounter->chief_complaint) {
            $symptoms[] = $encounter->chief_complaint;
        }
        
        // Extract from clinical notes if available
        foreach ($encounter->clinicalNotes as $note) {
            if (stripos($note->notes, 'symptom') !== false) {
                // Simple extraction - in real app, would use NLP or structured data
                $symptoms[] = $note->notes;
            }
        }

        return array_slice($symptoms, 0, 5); // Limit to 5 symptoms
    }

    /**
     * Format vital signs
     */
    private function formatVitals($vitals)
    {
        if (!$vitals) {
            return [
                'temperature' => 'N/A',
                'bloodPressure' => 'N/A',
                'heartRate' => 'N/A',
                'respiratoryRate' => 'N/A',
                'oxygenSaturation' => 'N/A'
            ];
        }

        return [
            'temperature' => $vitals->temperature ? $vitals->temperature . '°F' : 'N/A',
            'bloodPressure' => $vitals->systolic_bp && $vitals->diastolic_bp ? 
                $vitals->systolic_bp . '/' . $vitals->diastolic_bp . ' mmHg' : 'N/A',
            'heartRate' => $vitals->heart_rate ? $vitals->heart_rate . ' bpm' : 'N/A',
            'respiratoryRate' => $vitals->respiratory_rate ? $vitals->respiratory_rate . '/min' : 'N/A',
            'oxygenSaturation' => $vitals->oxygen_saturation ? $vitals->oxygen_saturation . '%' : 'N/A'
        ];
    }

    /**
     * Format lab results
     */
    private function formatLabResults($labOrders)
    {
        $results = [];
        
        foreach ($labOrders as $order) {
            foreach ($order->results as $result) {
                $results[] = [
                    'testName' => $result->test_name ?? $order->test_name,
                    'result' => $result->result_value ?? 'Pending',
                    'normalRange' => $result->reference_range ?? 'N/A',
                    'status' => $this->determineLabStatus($result)
                ];
            }
        }

        return $results;
    }

    /**
     * Determine lab result status
     */
    private function determineLabStatus($result)
    {
        if (!$result->result_value) {
            return 'Pending';
        }

        // Simple logic - in real app would have proper reference ranges
        if ($result->abnormal_flag) {
            return $result->abnormal_flag === 'critical' ? 'Critical' : 'Abnormal';
        }

        return 'Normal';
    }

    /**
     * Format medications (would typically come from prescriptions)
     */
    private function formatMedications($encounter)
    {
        // This would typically come from prescription items
        // For now, return empty array as we don't have direct relationship
        return [];
    }

    /**
     * Map gender code to readable name
     */
    private function mapGender($gender)
    {
        $mapping = [
            'M' => 'Male',
            'F' => 'Female',
            'O' => 'Other'
        ];

        return $mapping[$gender] ?? 'Unknown';
    }

    /**
     * Debug method to test encounter lookup
     */
    public function debug(Request $request, $id): JsonResponse
    {
        try {
            // Check if encounter exists by number
            $byNumber = Encounter::where('encounter_number', $id)->first();
            
            // Check if encounter exists by ID
            $byId = is_numeric($id) ? Encounter::find($id) : null;
            
            return response()->json([
                'search_term' => $id,
                'found_by_number' => $byNumber ? [
                    'id' => $byNumber->id,
                    'encounter_number' => $byNumber->encounter_number,
                    'patient_id' => $byNumber->patient_id,
                    'status' => $byNumber->status
                ] : null,
                'found_by_id' => $byId ? [
                    'id' => $byId->id,
                    'encounter_number' => $byId->encounter_number,
                    'patient_id' => $byId->patient_id,
                    'status' => $byId->status
                ] : null,
                'total_encounters' => Encounter::count(),
                'str_starts_with_check' => str_starts_with($id, 'ENC-')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'search_term' => $id
            ], 500);
        }
    }
}