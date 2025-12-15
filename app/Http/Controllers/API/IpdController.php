<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Encounter;
use App\Models\Ward;
use App\Services\IpdService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class IpdController extends Controller
{
    protected IpdService $ipdService;

    public function __construct(IpdService $ipdService)
    {
        $this->ipdService = $ipdService;
    }

    /**
     * Get IPD admissions.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'status', 'department_id', 'physician_id', 'ward_id',
                'start_date', 'end_date', 'search'
            ]);
            
            $perPage = $request->get('per_page', 15);
            $admissions = $this->ipdService->getIpdAdmissions($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $admissions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve IPD admissions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admit patient to IPD.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|uuid|exists:patients,id',
                'department_id' => 'required|uuid|exists:departments,id',
                'attending_physician_id' => 'required|uuid|exists:users,id',
                'bed_id' => 'nullable|uuid|exists:beds,id',
                'chief_complaint' => 'nullable|string|max:1000',
                'admission_datetime' => 'nullable|date',
                'admission_notes' => 'nullable|string|max:5000',
                'admission_diagnosis.icd10_code' => 'nullable|string|max:10',
                'admission_diagnosis.description' => 'nullable|string|max:500',
                'vital_signs.temperature' => 'nullable|numeric|between:30,45',
                'vital_signs.systolic_bp' => 'nullable|integer|between:50,300',
                'vital_signs.diastolic_bp' => 'nullable|integer|between:30,200',
                'vital_signs.heart_rate' => 'nullable|integer|between:30,250',
                'vital_signs.respiratory_rate' => 'nullable|integer|between:5,60',
                'vital_signs.oxygen_saturation' => 'nullable|numeric|between:50,100',
                'vital_signs.weight' => 'nullable|numeric|between:0.5,500',
                'vital_signs.height' => 'nullable|numeric|between:30,250',
            ]);

            $encounter = $this->ipdService->admitPatient($validated);

            return response()->json([
                'success' => true,
                'message' => 'Patient admitted successfully',
                'data' => $encounter,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to admit patient',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified IPD admission.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $encounter = Encounter::with([
                'patient.contacts', 'patient.addresses',
                'attendingPhysician', 'department',
                'bedAssignments.bed.ward',
                'diagnoses.diagnosedBy',
                'vitalSigns.recordedBy',
                'clinicalNotes.createdBy'
            ])->findOrFail($id);

            if ($encounter->type !== 'IPD') {
                return response()->json([
                    'success' => false,
                    'message' => 'This is not an IPD encounter',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $encounter,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'IPD admission not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Transfer patient to different bed/ward.
     */
    public function transfer(Request $request, string $id): JsonResponse
    {
        try {
            $encounter = Encounter::findOrFail($id);
            
            if ($encounter->type !== 'IPD') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only IPD patients can be transferred',
                ], 400);
            }

            $validated = $request->validate([
                'new_bed_id' => 'required|uuid|exists:beds,id',
                'transfer_reason' => 'required|string|max:1000',
                'assignment_notes' => 'nullable|string|max:1000',
            ]);

            $assignment = $this->ipdService->transferPatient($encounter, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Patient transferred successfully',
                'data' => $assignment->load(['encounter.patient', 'bed.ward']),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to transfer patient',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Discharge patient from IPD.
     */
    public function discharge(Request $request, string $id): JsonResponse
    {
        try {
            $encounter = Encounter::findOrFail($id);
            
            if ($encounter->type !== 'IPD') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only IPD patients can be discharged',
                ], 400);
            }

            $validated = $request->validate([
                'discharge_datetime' => 'nullable|date',
                'discharge_summary' => 'nullable|string|max:10000',
                'hospital_course' => 'nullable|string|max:5000',
                'discharge_medications' => 'nullable|string|max:5000',
                'follow_up_instructions' => 'nullable|string|max:5000',
                'discharge_condition' => 'nullable|string|max:1000',
                'discharge_diagnoses' => 'nullable|array',
                'discharge_diagnoses.*.icd10_code' => 'required|string|max:10',
                'discharge_diagnoses.*.description' => 'required|string|max:500',
                'discharge_diagnoses.*.type' => 'required|in:PRIMARY,SECONDARY,COMORBIDITY',
                'final_vital_signs.temperature' => 'nullable|numeric|between:30,45',
                'final_vital_signs.systolic_bp' => 'nullable|integer|between:50,300',
                'final_vital_signs.diastolic_bp' => 'nullable|integer|between:30,200',
                'final_vital_signs.heart_rate' => 'nullable|integer|between:30,250',
                'final_vital_signs.respiratory_rate' => 'nullable|integer|between:5,60',
                'final_vital_signs.oxygen_saturation' => 'nullable|numeric|between:50,100',
            ]);

            $encounter = $this->ipdService->dischargePatient($encounter, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Patient discharged successfully',
                'data' => $encounter,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to discharge patient',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current IPD census.
     */
    public function census(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['department_id', 'physician_id', 'ward_id']);
            $census = $this->ipdService->getIpdCensus($filters);

            return response()->json([
                'success' => true,
                'data' => $census,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve IPD census',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get ward census.
     */
    public function wardCensus(string $wardId): JsonResponse
    {
        try {
            $census = $this->ipdService->getWardCensus($wardId);

            return response()->json([
                'success' => true,
                'data' => $census,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve ward census',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get IPD statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['department_id', 'start_date', 'end_date']);
            $statistics = $this->ipdService->getIpdStatistics($filters);

            return response()->json([
                'success' => true,
                'data' => $statistics,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve IPD statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get discharge planning list.
     */
    public function dischargePlanning(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'expected_discharge_date', 'min_length_of_stay',
                'department_id', 'physician_id'
            ]);
            
            $dischargePlanning = $this->ipdService->getDischargePlanningList($filters);

            return response()->json([
                'success' => true,
                'data' => $dischargePlanning,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve discharge planning list',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get patient care plan.
     */
    public function carePlan(string $id): JsonResponse
    {
        try {
            $encounter = Encounter::findOrFail($id);
            
            if ($encounter->type !== 'IPD') {
                return response()->json([
                    'success' => false,
                    'message' => 'Care plan is only available for IPD patients',
                ], 400);
            }

            $carePlan = $this->ipdService->getPatientCarePlan($encounter);

            return response()->json([
                'success' => true,
                'data' => $carePlan,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve care plan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create discharge summary.
     */
    public function createDischargeSummary(Request $request, string $id): JsonResponse
    {
        try {
            $encounter = Encounter::findOrFail($id);
            
            if ($encounter->type !== 'IPD') {
                return response()->json([
                    'success' => false,
                    'message' => 'Discharge summary is only for IPD patients',
                ], 400);
            }

            $validated = $request->validate([
                'hospital_course' => 'nullable|string|max:5000',
                'discharge_medications' => 'nullable|string|max:5000',
                'follow_up_instructions' => 'nullable|string|max:5000',
                'discharge_condition' => 'nullable|string|max:1000',
            ]);

            $dischargeSummary = $this->ipdService->createDischargeSummary($encounter, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Discharge summary created successfully',
                'data' => $dischargeSummary,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create discharge summary',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}