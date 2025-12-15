<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\OpdService;
use App\Services\EmergencyService;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\Icd10Code;
use App\Events\ConsultationCompleted;
use Illuminate\Support\Facades\Log;


class OpdController extends Controller
{
    protected $opdService;
    protected $emergencyService;

    public function __construct(OpdService $opdService, EmergencyService $emergencyService)
    {
        $this->opdService = $opdService;
        $this->emergencyService = $emergencyService;
    }

    /**
     * Display the OPD dashboard
     */
    public function index()
    {
        $stats = $this->opdService->getDashboardStats();
        
        return Inertia::render('OPD/Index', [
            'stats' => [
                'totalPatients' => $stats['today_appointments'],
                'waitingPatients' => $stats['waiting_patients'],
                'inConsultation' => $stats['in_progress'],
                'completedToday' => $stats['completed_today']
            ],
            'queue' => $stats['queue']->map(function ($item) {
                return [
                    'id' => $item['id'],
                    'patient_name' => $item['patient_name'],
                    'queue_number' => $item['queue_number'],
                    'status' => $item['status'],
                    'waiting_time' => $item['waiting_time'],
                    'doctor_name' => $item['doctor_name'] ?? 'Not assigned',
                    'chief_complaint' => $item['chief_complaint'] ?? 'No complaint'
                ];
            }),
            'recentAppointments' => OpdAppointment::with(['patient', 'physician'])
                ->whereDate('appointment_date', today())
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($appointment) {
                    return [
                        'id' => $appointment->id,
                        'appointment_number' => $appointment->appointment_number,
                        'patient_id' => $appointment->patient_id,
                        'patient' => $appointment->patient ? [
                            'id' => $appointment->patient->id,
                            'first_name' => $appointment->patient->first_name,
                            'last_name' => $appointment->patient->last_name,
                        ] : null,
                        'doctor' => $appointment->physician ? [
                            'physician_code' => $appointment->physician->physician_code,
                            'name' => $appointment->physician->name,
                            'specialization' => $appointment->physician->specialization,
                        ] : null,
                        'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                        'appointment_time' => $appointment->appointment_time ? 
                            \Carbon\Carbon::parse($appointment->appointment_time)->format('H:i') : null,
                        'status' => $appointment->status,
                        'chief_complaint' => $appointment->chief_complaint ?? 'No complaint',
                        'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
                        'updated_at' => $appointment->updated_at->format('Y-m-d H:i:s'),
                    ];
                })
        ]);
    }

    /**
     * Display the OPD dashboard (alias for index)
     */
    public function dashboard()
    {
        return $this->index();
    }

    /**
     * Display the queue management page
     */
    public function queue()
    {
        $queue = $this->opdService->getTodayQueue();
        
        return Inertia::render('OPD/Queue', [
            'queue' => $queue,
            'stats' => $this->opdService->getDashboardStats()
        ]);
    }

    /**
     * Display the consultations page
     */
    public function consultations()
    {
        $consultations = $this->opdService->getTodayConsultations();
        
        // For now, we'll implement simple pagination manually
        // In a production system, you might want to implement proper pagination
        $perPage = 20;
        $currentPage = request()->get('page', 1);
        $total = $consultations->count();
        $consultationsForPage = $consultations->forPage($currentPage, $perPage);

        return Inertia::render('OPD/Consultations', [
            'appointments' => [
                'data' => $consultationsForPage->values(),
                'current_page' => $currentPage,
                'last_page' => ceil($total / $perPage),
                'per_page' => $perPage,
                'total' => $total,
            ]
        ]);
    }

    /**
     * Display the prescriptions page
     */
    public function prescriptions()
    {
        // Show prescriptions from all appointments that have prescriptions
        $appointments = OpdAppointment::with(['patient', 'physician', 'prescriptions'])
            ->whereDate('appointment_date', today())
            ->whereHas('prescriptions')
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        // Get prescription statistics
        $prescriptionStats = [
            'pending' => \App\Models\Prescription::whereDate('created_at', today())
                ->where('status', 'pending')
                ->count(),
            'verified' => \App\Models\Prescription::whereDate('created_at', today())
                ->where('status', 'verified')
                ->count(),
            'dispensed' => \App\Models\Prescription::whereDate('created_at', today())
                ->where('status', 'dispensed')
                ->count(),
        ];

        return Inertia::render('OPD/Prescriptions', [
            'appointments' => [
                'data' => $appointments->getCollection()->map(function ($appointment) {
                    // Get the first prescription for this appointment
                    $prescription = $appointment->prescriptions->first();
                    
                    return [
                        'id' => $appointment->id,
                        'appointment_number' => $appointment->appointment_number,
                        'patient' => [
                            'id' => $appointment->patient->id,
                            'first_name' => $appointment->patient->first_name,
                            'last_name' => $appointment->patient->last_name,
                        ],
                        'doctor' => $appointment->physician ? [
                            'physician_code' => $appointment->physician->physician_code,
                            'name' => $appointment->physician->name,
                            'specialization' => $appointment->physician->specialization,
                        ] : null,
                        'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                        'appointment_time' => $appointment->appointment_time ? 
                            \Carbon\Carbon::parse($appointment->appointment_time)->format('H:i') : null,
                        'status' => $appointment->status,
                        'consultation_completed_at' => $appointment->consultation_completed_at ? 
                            $appointment->consultation_completed_at->format('Y-m-d H:i:s') : null,
                        'prescription_status' => $prescription ? $prescription->status : 'pending',
                        'prescription_count' => $appointment->prescriptions->count(),
                        'prescriptions' => $appointment->prescriptions->map(function($p) {
                            return [
                                'id' => $p->id,
                                'drug_name' => $p->drug_name,
                                'dosage' => $p->dosage,
                                'frequency' => $p->frequency,
                                'status' => $p->status,
                            ];
                        }),
                        'patient_id' => $appointment->patient_id,
                        'doctor_id' => $appointment->physician->physician_code ?? null,
                    ];
                }),
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ],
            'prescriptionStats' => $prescriptionStats
        ]);
    }

    /**
     * Register a new patient and create appointment
     */
    public function registerPatient(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:users,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'nullable',
            'appointment_type' => 'required|in:SCHEDULED,WALK_IN,EMERGENCY',
            'chief_complaint' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        try {
            $appointment = $this->opdService->registerPatient(
                ['patient_id' => $validated['patient_id']],
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Patient registered successfully',
                'appointment' => $appointment
            ]);
        } catch (\Exception $e) {
            // Check if this is a validation error (duplicate patient)
            if (str_contains($e->getMessage(), 'already has an active appointment')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400); // Bad Request for validation errors
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to register patient: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start consultation for an appointment
     */
    public function startConsultation(Request $request, $appointmentId)
    {
        try {
            $result = $this->opdService->startConsultation($appointmentId, auth()->id());
            
            return response()->json([
                'success' => true,
                'message' => 'Consultation started successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start consultation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete consultation for an appointment
     */
    public function completeConsultation(Request $request, $appointmentId)
    {
        try {
            $result = $this->opdService->completeConsultation($appointmentId);

            // ✅ After completion, fire the event for billing
            if ($result && isset($result['appointment'])) {
                $appointment = $result['appointment'];
                $doctor = $appointment->physician ?? $appointment->doctor ?? auth()->user();
                $consultationType = $request->input('consultation_type', 'general');

                Log::info('🚀 Dispatching ConsultationCompleted event', [
                    'encounter_id' => $appointment->id,
                    'doctor_id' => $doctor->id ?? null,
                    'consultation_type' => $consultationType,
                ]);

                event(new ConsultationCompleted(
                    $appointment->id,
                    $doctor->id ?? null,
                    $consultationType
                ));
            }
            Log::info('📨 ConsultationCompleted event dispatched successfully');


            // ✅ Inertia request → must return redirect or Inertia page
            if ($request->header('X-Inertia')) {
                return redirect()
                    ->route('opd.consultations')
                    ->with('success', 'Consultation completed successfully');
            }

            // ✅ AJAX / API request → return JSON
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Consultation completed successfully',
                    'data' => $result,
                ]);
            }

            // ✅ Normal browser form submission (non-AJAX)
            return redirect()->route('opd.consultations')
                ->with('success', 'Consultation completed successfully');
        } catch (\Exception $e) {
            Log::error('❌ Failed to complete consultation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->header('X-Inertia')) {
                return back()->withErrors([
                    'error' => 'Failed to complete consultation: ' . $e->getMessage(),
                ]);
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to complete consultation: ' . $e->getMessage(),
                ], 500);
            }

            return back()->withErrors([
                'error' => 'Failed to complete consultation: ' . $e->getMessage(),
            ]);
        }
    }



    /**
     * Edit SOAP notes for a consultation
     */
    public function editSoapNotes($appointmentId)
    {
        // First try to find OPD appointment
        $opdAppointment = OpdAppointment::with(['patient', 'physician', 'latestSoapNote', 'prescriptions.drugFormulary'])->find($appointmentId);
        
        if ($opdAppointment) {
            // Fetch emergency data for the patient - Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($opdAppointment->patient_id);
            $triageAssessment = null;
            
            if ($emergencyData) {
                $triageAssessment = $this->emergencyService->getLatestTriageAssessment($emergencyData->id);
            }
            
            // Format prescriptions for the view
            $prescriptions = $opdAppointment->prescriptions->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'drug_id' => $prescription->drug_id,
                    'drug_name' => $prescription->drug_name,
                    'dosage' => $prescription->dosage,
                    'frequency' => $prescription->frequency,
                    'duration' => $prescription->duration,
                    'quantity' => $prescription->quantity,
                    'instant_dispensing' => $prescription->instant_dispensing,
                    'stock_reserved' => $prescription->stock_reserved,
                    'status' => $prescription->status,
                    'notes' => $prescription->notes,
                    'created_at' => $prescription->created_at,
                    'updated_at' => $prescription->updated_at,
                ];
            });
            
            // Load lab orders for the appointment - Requirements 6.2, 6.4
            $labOrders = \App\Models\LabOrder::where('encounter_id', $opdAppointment->id)
                ->get()
                ->map(function ($labOrder) {
                    return [
                        'id' => $labOrder->id,
                        'test_name' => $labOrder->test_name,
                        'priority' => $labOrder->priority,
                        'clinical_notes' => $labOrder->clinical_notes,
                        'expected_completion_at' => $labOrder->expected_completion_at,
                        'status' => $labOrder->status,
                        'created_at' => $labOrder->created_at,
                        'updated_at' => $labOrder->updated_at,
                    ];
                });
            
            return Inertia::render('OPD/SoapNotes', [
                'appointment' => [
                    'id' => $opdAppointment->id,
                    'type' => 'opd',
                    'appointment_number' => $opdAppointment->appointment_number,
                    'patient' => [
                        'id' => $opdAppointment->patient->id,
                        'first_name' => $opdAppointment->patient->first_name,
                        'last_name' => $opdAppointment->patient->last_name,
                    ],
                    'doctor' => $opdAppointment->physician ? [
                        'physician_code' => $opdAppointment->physician->physician_code,
                        'name' => $opdAppointment->physician->name,
                        'specialization' => $opdAppointment->physician->specialization,
                    ] : null,
                    'status' => $opdAppointment->status,
                    'chief_complaint' => $opdAppointment->chief_complaint,
                ],
                'soapNote' => $opdAppointment->latestSoapNote,
                'prescriptions' => $prescriptions,
                'labOrders' => $labOrders,
                'emergencyData' => $emergencyData,
                'triageAssessment' => $triageAssessment,
            ]);
        }

        // Try to find regular appointment
        $regularAppointment = \App\Models\Appointment::with(['patient', 'physician'])->find($appointmentId);
        
        if ($regularAppointment) {
            // Fetch emergency data for the patient - Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
            $emergencyData = $this->emergencyService->getEmergencyDataForPatient($regularAppointment->patient_id);
            $triageAssessment = null;
            
            if ($emergencyData) {
                $triageAssessment = $this->emergencyService->getLatestTriageAssessment($emergencyData->id);
            }
            
            // Load prescriptions for regular appointments
            $prescriptions = \App\Models\Prescription::where('encounter_id', $appointmentId)
                ->with('drugFormulary')
                ->get()
                ->map(function ($prescription) {
                    return [
                        'id' => $prescription->id,
                        'drug_id' => $prescription->drug_id,
                        'drug_name' => $prescription->drug_name,
                        'dosage' => $prescription->dosage,
                        'frequency' => $prescription->frequency,
                        'duration' => $prescription->duration,
                        'quantity' => $prescription->quantity,
                        'instant_dispensing' => $prescription->instant_dispensing,
                        'stock_reserved' => $prescription->stock_reserved,
                        'status' => $prescription->status,
                        'notes' => $prescription->notes,
                        'created_at' => $prescription->created_at,
                        'updated_at' => $prescription->updated_at,
                    ];
                });
            
            // Load lab orders for regular appointments - Requirements 6.2, 6.4
            $labOrders = \App\Models\LabOrder::where('encounter_id', $appointmentId)
                ->get()
                ->map(function ($labOrder) {
                    return [
                        'id' => $labOrder->id,
                        'test_name' => $labOrder->test_name,
                        'priority' => $labOrder->priority,
                        'clinical_notes' => $labOrder->clinical_notes,
                        'expected_completion_at' => $labOrder->expected_completion_at,
                        'status' => $labOrder->status,
                        'created_at' => $labOrder->created_at,
                        'updated_at' => $labOrder->updated_at,
                    ];
                });
            
            return Inertia::render('OPD/SoapNotes', [
                'appointment' => [
                    'id' => $regularAppointment->id,
                    'type' => 'regular',
                    'appointment_number' => $regularAppointment->appointment_number,
                    'patient' => [
                        'id' => $regularAppointment->patient->id,
                        'first_name' => $regularAppointment->patient->first_name,
                        'last_name' => $regularAppointment->patient->last_name,
                    ],
                    'doctor' => $regularAppointment->physician ? [
                        'physician_code' => $regularAppointment->physician->physician_code,
                        'name' => $regularAppointment->physician->name,
                        'specialization' => $regularAppointment->physician->specialization,
                    ] : null,
                    'status' => $regularAppointment->status,
                    'chief_complaint' => $regularAppointment->chief_complaint,
                ],
                'soapNote' => null, // Regular appointments use different SOAP system
                'prescriptions' => $prescriptions,
                'labOrders' => $labOrders,
                'emergencyData' => $emergencyData,
                'triageAssessment' => $triageAssessment,
            ]);
        }

        abort(404, 'Appointment not found');
    }

    /**
     * Save SOAP notes for a consultation
     */
    public function saveSoapNotes(Request $request, $appointmentId)
    {
        $validated = $request->validate([
            'subjective' => 'nullable|string',
            'objective' => 'nullable|string',
            'assessment' => 'nullable|string',
            'plan' => 'nullable|string',
            'medications' => 'nullable|array',
            'medications.*.drug_name' => 'required_with:medications|string',
            'medications.*.dosage' => 'nullable|string',
            'medications.*.frequency' => 'nullable|string',
            'medications.*.duration' => 'nullable|string',
            'medications.*.quantity' => 'nullable|string',
            'medications.*.instructions' => 'nullable|string',
        ]);

        try {
            // Check if it's an OPD appointment first
            $opdAppointment = OpdAppointment::find($appointmentId);
            if ($opdAppointment) {
                $result = $this->opdService->saveSOAP($appointmentId, $validated);
                return back()->with('success', 'SOAP notes saved successfully');
            }

            // Check if it's a regular appointment
            $regularAppointment = \App\Models\Appointment::find($appointmentId);
            if ($regularAppointment) {
                // For regular appointments, save SOAP notes in appointment_notes field as JSON
                $soapNotes = [
                    'subjective' => $validated['subjective'],
                    'objective' => $validated['objective'],
                    'assessment' => $validated['assessment'],
                    'plan' => $validated['plan'],
                    'medications' => $validated['medications'] ?? [],
                    'created_at' => now()->toISOString(),
                    'created_by' => auth()->id() ?? 'system'
                ];

                $regularAppointment->update([
                    'appointment_notes' => json_encode($soapNotes)
                ]);

                // Handle medications for regular appointments
                if (!empty($validated['medications'])) {
                    // Clear existing prescriptions for this appointment
                    \App\Models\Prescription::where('encounter_id', $appointmentId)->delete();

                    // Create new prescriptions
                    foreach ($validated['medications'] as $medication) {
                        if (!empty($medication['drug_name'])) {
                            \App\Models\Prescription::create([
                                'encounter_id' => $appointmentId,
                                'patient_id' => $regularAppointment->patient_id,
                                'physician_id' => $regularAppointment->physician_id,
                                'drug_name' => $medication['drug_name'],
                                'dosage' => $medication['dosage'] ?? null,
                                'frequency' => $medication['frequency'] ?? null,
                                'duration' => $medication['duration'] ?? null,
                                'quantity' => $medication['quantity'] ?? null,
                                'status' => 'pending',
                                'notes' => $medication['instructions'] ?? null,
                                'prescription_data' => $medication,
                            ]);
                        }
                    }
                }

                return back()->with('success', 'SOAP notes and prescriptions saved successfully');
            }

            throw new \Exception('Appointment not found');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to save SOAP notes: ' . $e->getMessage()]);
        }
    }

    /**
     * View SOAP notes for a completed consultation
     */
    public function viewSoapNotes($appointmentId)
    {
        // First try to find OPD appointment
        $opdAppointment = OpdAppointment::with(['patient', 'physician', 'latestSoapNote'])->find($appointmentId);
        
        if ($opdAppointment) {
            return Inertia::render('OPD/ViewSoapNotes', [
                'appointment' => [
                    'id' => $opdAppointment->id,
                    'type' => 'opd',
                    'appointment_number' => $opdAppointment->appointment_number,
                    'patient' => [
                        'id' => $opdAppointment->patient->id,
                        'first_name' => $opdAppointment->patient->first_name,
                        'last_name' => $opdAppointment->patient->last_name,
                    ],
                    'doctor' => $opdAppointment->physician ? [
                        'physician_code' => $opdAppointment->physician->physician_code,
                        'name' => $opdAppointment->physician->name,
                        'specialization' => $opdAppointment->physician->specialization,
                    ] : null,

                    'status' => $opdAppointment->status,
                    'chief_complaint' => $opdAppointment->chief_complaint,
                    'consultation_completed_at' => $opdAppointment->consultation_completed_at,
                ],
                'soapNote' => $opdAppointment->latestSoapNote
            ]);
        }

        // Try to find regular appointment
        $regularAppointment = \App\Models\Appointment::with(['patient', 'physician'])->find($appointmentId);
        
        if ($regularAppointment) {
            // Parse SOAP notes from appointment_notes JSON
            $soapNote = null;
            if ($regularAppointment->appointment_notes) {
                try {
                    $soapNote = json_decode($regularAppointment->appointment_notes, true);
                } catch (\Exception $e) {
                    $soapNote = null;
                }
            }

            return Inertia::render('OPD/ViewSoapNotes', [
                'appointment' => [
                    'id' => $regularAppointment->id,
                    'type' => 'regular',
                    'appointment_number' => $regularAppointment->appointment_number,
                    'patient' => [
                        'id' => $regularAppointment->patient->id,
                        'first_name' => $regularAppointment->patient->first_name,
                        'last_name' => $regularAppointment->patient->last_name,
                    ],
                    'doctor' => $regularAppointment->physician ? [
                        'physician_code' => $regularAppointment->physician->physician_code,
                        'name' => $regularAppointment->physician->name,
                        'specialization' => $regularAppointment->physician->specialization,
                    ] : null,

                    'status' => $regularAppointment->status,
                    'chief_complaint' => $regularAppointment->chief_complaint,
                    'consultation_completed_at' => $regularAppointment->completed_at,
                ],
                'soapNote' => $soapNote
            ]);
        }

        abort(404, 'Appointment not found');
    }

    /**
     * Send prescription to pharmacy
     */
    public function sendPrescriptionToPharmacy(Request $request)
    {
        \Log::info('Send Prescription to Pharmacy - Request received', [
            'request_data' => $request->all(),
            'content_type' => $request->header('Content-Type'),
            'method' => $request->method(),
            'user' => auth()->user() ? auth()->user()->id : 'not authenticated'
        ]);

        try {
            $validated = $request->validate([
                'appointment_id' => 'required|integer',
                'patient_id'     => 'required|string|exists:patients,id',
                'doctor_id'      => 'required|string|exists:physicians,physician_code',
                'drug_name'      => 'required|string|max:255',
                'dosage'         => 'nullable|string|max:255',
                'frequency'      => 'nullable|string|max:255',
                'duration'       => 'required|numeric|min:1',
                'quantity'       => 'required|numeric|min:1',
                'notes'          => 'nullable|string',
            ]);


        // ✅ Here’s where you fetch the doctor:
        // Find the appointment - check both OPD and regular appointments
        $appointment = OpdAppointment::with(['patient', 'physician'])->find($validated['appointment_id']);
        
        // If not found in OPD appointments, check regular appointments
        if (!$appointment) {
            $regularAppointment = \App\Models\Appointment::with(['patient', 'physician'])->find($validated['appointment_id']);
            
            if ($regularAppointment) {
                // Convert regular appointment to OPD-like structure for consistency
                $appointment = (object) [
                    'id' => $regularAppointment->id,
                    'patient_id' => $regularAppointment->patient_id,
                    'patient' => $regularAppointment->patient,
                    'physician' => $regularAppointment->physician,
                    'appointment_date' => $regularAppointment->appointment_date,
                    'appointment_time' => $regularAppointment->appointment_time,
                    'chief_complaint' => $regularAppointment->chief_complaint,
                    'latestSoapNote' => null, // Regular appointments don't have SOAP notes
                ];
            }
        }
        
        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found'
            ], 404);
        }
        
        $doctor = $appointment->physician;
        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor not found for this appointment'
            ], 404);
        }

        // Use frontend data if provided, otherwise extract from SOAP notes
        if (!empty($validated['drug_name'])) {
            // Use detailed prescription data from frontend (from SoapNotes.tsx)
            \Log::info('Using detailed drug data from frontend', ['drug_name' => $validated['drug_name']]);
            $drugName = $validated['drug_name'];
            $dosage = $validated['dosage'] ?? null;
            $frequency = $validated['frequency'] ?? null;
            $duration = $validated['duration'] ?? null;
            $quantity = $validated['quantity'] ?? null;
        } else {
            // Extract medication details from SOAP notes as fallback (from Prescriptions.tsx)
            \Log::info('Extracting drug data from SOAP notes', ['appointment_id' => $validated['appointment_id']]);
            $medicationDetails = $this->extractMedicationFromSOAP($appointment->latestSoapNote);
            $drugName = $medicationDetails['drug_name'] ?? 'Prescription from SOAP notes';
            $dosage = $medicationDetails['dosage'];
            $frequency = $medicationDetails['frequency'];
            $duration = $medicationDetails['duration'];
            $quantity = $medicationDetails['quantity'];
        }
        
        // Now use it when saving the prescription:
       /* $prescription = \App\Models\Prescription::updateOrCreate(
            [
                'encounter_id' => $validated['appointment_id'],
                'patient_id'   => $validated['patient_id'],
            ],
            [
                'physician_id' => $doctor->physician_code,
                'status'       => 'verified',
                'drug_name'    => $drugName,
                'dosage'       => $dosage,
                'frequency'    => $frequency,
                'duration'     => (string) $duration,
                'quantity'     => (string) $quantity,
                'notes'        => "Sent to pharmacy by {$doctor->name} ({$doctor->specialization}) on " . now()->format('Y-m-d H:i:s')
                    . "\nDrug: {$drugName}, {$dosage}, {$frequency}, {$duration} days, Qty: {$quantity}"
                    . (isset($appointment->latestSoapNote) && !empty($appointment->latestSoapNote?->plan)
                        ? "\nPlan: " . $appointment->latestSoapNote->plan
                        : '')
                    . "\nSent by: {$doctor->name} (Code: {$doctor->physician_code})",
            ]

        );*/

        $prescription = \App\Models\Prescription::updateOrCreate(
            [
                'encounter_id' => $validated['appointment_id'],
                'patient_id'   => $validated['patient_id'],
                'drug_name'    => $validated['drug_name'],
            ],
            [
                'physician_id' => $doctor->physician_code,
                'status'       => 'verified',
                'drug_name'    => $validated['drug_name'],
                'dosage'       => (string) $validated['dosage'],
                'frequency'    => (string) $validated['frequency'],
                'duration'     => (string) $validated['duration'],
                'quantity'     => (string) $validated['quantity'],
                'prescription_data' => json_encode([
                    'encounter_id' => $validated['appointment_id'],
                    'patient' => [
                        'id' => $validated['patient_id'],
                        'name' => optional($appointment->patient)->full_name,
                    ],
                    'physician' => [
                        'id' => $doctor->physician_code,
                        'name' => $doctor->name,
                        'specialization' => $doctor->specialization,
                    ],
                    'drug' => [
                        'name' => $validated['drug_name'],
                        'dosage' => $validated['dosage'],
                        'frequency' => $validated['frequency'],
                        'duration' => $validated['duration'],
                        'quantity' => $validated['quantity'],
                    ],
                    'soap_plan' => isset($appointment->latestSoapNote) ? optional($appointment->latestSoapNote)->plan : null,
                    'created_at' => now()->toDateTimeString(),
                ], JSON_PRETTY_PRINT),
                'notes' => "Sent to pharmacy by {$doctor->name} ({$doctor->specialization}) on "
                    . now()->format('Y-m-d H:i:s')
                    . (isset($appointment->latestSoapNote) && !empty($appointment->latestSoapNote?->plan)
                        ? "\nPlan: " . $appointment->latestSoapNote->plan
                        : '')
                    . "\nSent by: {$doctor->name} (Code: {$doctor->physician_code})",
            ]
        );



        

        // Generate billing for the prescription
        $this->generatePrescriptionBilling($prescription);
        
        // Generate consultation billing if it doesn't exist
        $this->generateConsultationBilling($validated['appointment_id'], $doctor->physician_code);
        
        // Generate invoice if it doesn't exist
        $invoiceService = new \App\Services\InvoiceService();
        try {
            $invoiceService->generateInvoiceFromBillingAccount($validated['appointment_id'], $validated['patient_id']);
        } catch (\Exception $e) {
            \Log::warning('Invoice generation failed during prescription send', [
                'appointment_id' => $validated['appointment_id'],
                'error' => $e->getMessage()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Prescription for {$appointment->patient->first_name} {$appointment->patient->last_name} sent to pharmacy successfully and billing generated",
            'doctor'  => [
                'code' => $doctor->physician_code,
                'name' => $doctor->name,
                'specialization' => $doctor->specialization,
            ],
            'data' => $prescription,
        ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Send Prescription to Pharmacy - Validation Error', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Send Prescription to Pharmacy Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send prescription to pharmacy: ' . $e->getMessage()
            ], 500);
        }
    }



    /**
     * Create a new lab order for an appointment
     * Requirements: 4.2, 4.4, 4.5, 6.4
     */
    public function createLabOrder(Request $request, $appointmentId)
    {
        dd('Method called', auth()->id(), auth()->check(), auth()->user());
        
        try {
            // Validate the request
            $validated = $request->validate([
                'test_id' => 'required|exists:test_catalogs,id',
                'priority' => 'required|in:urgent,fast,normal',
                'clinical_notes' => 'nullable|string',
            ]);

            // Find the appointment
            $appointment = OpdAppointment::findOrFail($appointmentId);
            
            // Check if consultation is completed (Requirement 5.5: Prevent modifications after completion)
            if ($appointment->status === 'COMPLETED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot add lab orders to completed consultations'
                ], 422);
            }

            // Determine who ordered the test
            // Try multiple auth methods to get the user ID
            $sanctumId = auth('sanctum')->id();
            $authId = auth()->id();
            $requestUserId = $request->user()?->id;
            $doctorId = $appointment->doctor_id;
            
            $orderedBy = $sanctumId ?? $authId ?? $requestUserId ?? $doctorId;
            
            if (!$orderedBy) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot determine ordering physician',
                    'debug' => [
                        'sanctum_id' => $sanctumId,
                        'auth_id' => $authId,
                        'request_user_id' => $requestUserId,
                        'doctor_id' => $doctorId,
                    ]
                ], 422);
            }

            // Prepare lab order data
            $labOrderData = [
                'test_id' => $validated['test_id'],
                'encounter_id' => $appointmentId,
                'patient_id' => $appointment->patient_id,
                'ordered_by' => $orderedBy,
                'priority' => $validated['priority'],
                'clinical_notes' => $validated['clinical_notes'] ?? null,
            ];
            
            // Use the LabOrderService to create the lab order
            $labOrderService = app(\App\Services\LabOrderService::class);
            $labOrder = $labOrderService->createLabOrder($labOrderData);

            return response()->json([
                'success' => true,
                'message' => 'Lab order created successfully',
                'data' => $labOrder
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to create lab order', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create lab order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing lab order
     * Requirements: 6.4
     */
    public function updateLabOrder(Request $request, $appointmentId, $labOrderId)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'test_id' => 'sometimes|required|exists:test_catalogs,id',
                'priority' => 'sometimes|required|in:urgent,fast,normal',
                'clinical_notes' => 'nullable|string',
            ]);

            // Find the appointment
            $appointment = OpdAppointment::findOrFail($appointmentId);
            
            // Check if consultation is completed (Requirement 5.5: Prevent modifications after completion)
            if ($appointment->status === 'COMPLETED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot modify lab orders for completed consultations'
                ], 422);
            }

            // Find the lab order
            $labOrder = \App\Models\LabOrder::where('id', $labOrderId)
                ->where('encounter_id', $appointmentId)
                ->firstOrFail();

            // If test_id is being updated, also update test_name
            if (isset($validated['test_id'])) {
                $testCatalog = \App\Models\TestCatalog::findOrFail($validated['test_id']);
                $validated['test_name'] = $testCatalog->name;
            }

            // Update the lab order
            $labOrder->update($validated);

            // Recalculate expected completion if priority changed
            if (isset($validated['priority'])) {
                $labOrder->calculateExpectedCompletion();
            }

            return response()->json([
                'success' => true,
                'message' => 'Lab order updated successfully',
                'data' => $labOrder->fresh()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lab order not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Failed to update lab order', [
                'appointment_id' => $appointmentId,
                'lab_order_id' => $labOrderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update lab order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a lab order
     * Requirements: 6.4
     */
    public function deleteLabOrder(Request $request, $appointmentId, $labOrderId)
    {
        try {
            // Find the appointment
            $appointment = OpdAppointment::findOrFail($appointmentId);
            
            // Check if consultation is completed (Requirement 5.5: Prevent modifications after completion)
            if ($appointment->status === 'COMPLETED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete lab orders from completed consultations'
                ], 422);
            }

            // Find and delete the lab order
            $labOrder = \App\Models\LabOrder::where('id', $labOrderId)
                ->where('encounter_id', $appointmentId)
                ->firstOrFail();

            $labOrder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lab order deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lab order not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Failed to delete lab order', [
                'appointment_id' => $appointmentId,
                'lab_order_id' => $labOrderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete lab order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check in a scheduled appointment
     */
    public function checkInAppointment(Request $request, $appointmentId)
    {
        try {
            $opdAppointment = $this->opdService->checkInScheduledAppointment($appointmentId);
            
            return response()->json([
                'success' => true,
                'message' => 'Patient checked in successfully',
                'appointment' => $opdAppointment
            ]);
        } catch (\Exception $e) {
            // Check if this is a validation error (appointment status issue or duplicate patient)
            if (str_contains($e->getMessage(), 'not in scheduled status') || 
                str_contains($e->getMessage(), 'Appointment is not') ||
                str_contains($e->getMessage(), 'already has an active appointment') ||
                str_contains($e->getMessage(), 'status')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400); // Bad Request instead of 500
            }
            
            // Check if this is a database constraint violation (duplicate appointment number)
            if (str_contains($e->getMessage(), 'Duplicate entry') || 
                str_contains($e->getMessage(), 'Integrity constraint violation') ||
                str_contains($e->getMessage(), 'appointment_number_unique')) {
                return response()->json([
                    'success' => false,
                    'message' => 'This appointment has already been checked in.'
                ], 409); // Conflict status code
            }
            
            // For other errors, return 500
            \Log::error('Check-in appointment error', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to check in patient: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard data for AJAX requests
     */
    public function getDashboardData()
    {
        try {
            $stats = $this->opdService->getDashboardStats();
            
            return response()->json([
                'stats' => [
                    'totalPatients' => $stats['today_appointments'],
                    'waitingPatients' => $stats['waiting_patients'],
                    'inConsultation' => $stats['in_progress'],
                    'completedToday' => $stats['completed_today']
                ],
                'queue' => $stats['queue'],
                'recentAppointments' => OpdAppointment::with(['patient', 'physician'])
                    ->whereDate('appointment_date', today())
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->get()
                    ->map(function ($appointment) {
                        return [
                            'id' => $appointment->id,
                            'appointment_number' => $appointment->appointment_number,
                            'patient' => $appointment->patient ? [
                                'id' => $appointment->patient->id,
                                'first_name' => $appointment->patient->first_name,
                                'last_name' => $appointment->patient->last_name,
                            ] : null,
                            'doctor' => $appointment->physician ? [
                                'physician_code' => $appointment->physician->physician_code,
                                'name' => $appointment->physician->name,
                                'specialization' => $appointment->physician->specialization,
                            ] : null,


                            'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                            'appointment_time' => $appointment->appointment_time ? 
                                \Carbon\Carbon::parse($appointment->appointment_time)->format('H:i') : null,
                            'status' => $appointment->status,
                            'chief_complaint' => $appointment->chief_complaint,
                            'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
                            'updated_at' => $appointment->updated_at->format('Y-m-d H:i:s'),
                        ];
                    })
            ]);
        } catch (\Exception $e) {
            \Log::error('Dashboard Data Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to load dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract medication details from SOAP notes plan
     */
    private function extractMedicationFromSOAP($soapNote)
    {
        if (!$soapNote || !$soapNote->plan) {
            return [
                'drug_name' => 'Prescription from consultation',
                'dosage' => null,
                'frequency' => null,
                'duration' => null,
                'quantity' => null
            ];
        }

        $plan = $soapNote->plan;
        $medications = [];

        // Common medication patterns to look for
        $patterns = [
            // Pattern: Drug name dosage frequency for duration
            '/(?:take\s+|prescribe\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)*?)\s+(\d+(?:\.\d+)?(?:mg|g|ml|mcg|units?))\s+(.*?(?:daily|twice|thrice|every|per|morning|evening|night|times?).*?)\s+(?:for\s+)?(\d+\s*(?:days?|weeks?|months?))/i',
            // Pattern: Drug name - dosage - frequency
            '/([A-Za-z\s]+)\s*[-–]\s*(\d+(?:\.\d+)?(?:mg|g|ml|mcg|units?))\s*[-–]\s*(.*?(?:daily|twice|thrice|every|per|morning|evening|night|times?).*?)(?:\n|$)/i',
            // Pattern: Drug name (dosage) frequency
            '/([A-Za-z\s]+)\s*\((\d+(?:\.\d+)?(?:mg|g|ml|mcg|units?))\)\s+(.*?(?:daily|twice|thrice|every|per|morning|evening|night|times?).*?)(?:\n|$)/i'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $plan, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    $medications[] = [
                        'drug_name' => trim($match[1]),
                        'dosage' => trim($match[2]),
                        'frequency' => trim($match[3]),
                        'duration' => isset($match[4]) ? trim($match[4]) : null,
                        'quantity' => null // Will be calculated based on duration and frequency
                    ];
                }
                break; // Use first matching pattern
            }
        }

        // If no structured medication found, try to extract any drug names
        if (empty($medications)) {
            // Look for common drug names or medication keywords
            $drugKeywords = ['tablet', 'capsule', 'syrup', 'injection', 'mg', 'ml', 'daily', 'twice', 'thrice'];
            $hasKeywords = false;
            foreach ($drugKeywords as $keyword) {
                if (stripos($plan, $keyword) !== false) {
                    $hasKeywords = true;
                    break;
                }
            }

            if ($hasKeywords) {
                // Extract first line that might contain medication
                $lines = explode("\n", $plan);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (strlen($line) > 5 && (
                        stripos($line, 'mg') !== false || 
                        stripos($line, 'tablet') !== false || 
                        stripos($line, 'capsule') !== false ||
                        stripos($line, 'daily') !== false
                    )) {
                        return [
                            'drug_name' => $line,
                            'dosage' => null,
                            'frequency' => null,
                            'duration' => null,
                            'quantity' => null
                        ];
                    }
                }
            }
        }

        // Return first medication found or default
        if (!empty($medications)) {
            $med = $medications[0];
            
            // Try to extract duration as number of days
            $durationDays = null;
            if ($med['duration']) {
                if (preg_match('/(\d+)\s*days?/i', $med['duration'], $durationMatch)) {
                    $durationDays = (int)$durationMatch[1];
                } elseif (preg_match('/(\d+)\s*weeks?/i', $med['duration'], $durationMatch)) {
                    $durationDays = (int)$durationMatch[1] * 7;
                } elseif (preg_match('/(\d+)\s*months?/i', $med['duration'], $durationMatch)) {
                    $durationDays = (int)$durationMatch[1] * 30;
                }
            }
            
            return [
                'drug_name' => $med['drug_name'],
                'dosage' => $med['dosage'],
                'frequency' => $med['frequency'],
                'duration' => $durationDays,
                'quantity' => $this->calculateQuantity($med['frequency'], $durationDays)
            ];
        }

        // Default fallback
        return [
            'drug_name' => 'Medication as per consultation plan',
            'dosage' => null,
            'frequency' => null,
            'duration' => null,
            'quantity' => null
        ];
    }

    /**
     * Calculate quantity based on frequency and duration
     */
    private function calculateQuantity($frequency, $durationDays)
    {
        if (!$frequency || !$durationDays) {
            return null;
        }

        $dailyDoses = 1; // Default to once daily

        // Extract daily frequency
        if (preg_match('/(\d+)\s*times?\s*(?:a\s*day|daily|per\s*day)/i', $frequency, $match)) {
            $dailyDoses = (int)$match[1];
        } elseif (stripos($frequency, 'twice') !== false || stripos($frequency, '2') !== false) {
            $dailyDoses = 2;
        } elseif (stripos($frequency, 'thrice') !== false || stripos($frequency, 'three') !== false) {
            $dailyDoses = 3;
        } elseif (stripos($frequency, 'four') !== false || stripos($frequency, '4') !== false) {
            $dailyDoses = 4;
        }

        return $dailyDoses * $durationDays;
    }

    /**
     * Generate billing for prescription (adapted for single prescription record)
     */
    private function generatePrescriptionBilling($prescription)
    {
        try {
            \DB::transaction(function () use ($prescription) {
                // Create or get billing account for this encounter
                $billingAccount = \App\Models\BillingAccount::firstOrCreate([
                    'patient_id' => $prescription->patient_id,
                    'encounter_id' => $prescription->encounter_id,
                ], [
                    'account_no' => 'BA' . str_pad($prescription->encounter_id, 6, '0', STR_PAD_LEFT),
                    'status' => 'open',
                ]);

                // Try to find a matching service in the service catalogue
                $service = $this->findMedicationService($prescription->drug_name);
                
                // If no specific service found, use or create generic prescription service
                if (!$service) {
                    $service = $this->getOrCreateGenericPrescriptionService();
                }
                
                \Log::info('Service lookup for billing', [
                    'drug_name' => $prescription->drug_name,
                    'found_service' => $service ? ['id' => $service->id, 'code' => $service->code, 'name' => $service->name, 'price' => $service->unit_price] : null
                ]);

                // Calculate pricing
                $quantity = (int) ($prescription->quantity ?? 1);
                $unitPrice = $service ? (float) $service->unit_price : $this->getDefaultDrugPrice($prescription->drug_name);
                $amount = $unitPrice * $quantity;
                
                \Log::info('Billing calculation debug', [
                    'prescription_quantity' => $prescription->quantity,
                    'calculated_quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'calculated_amount' => $amount
                ]);

                // Create billing item for the prescription
                \App\Models\BillingItem::create([
                    'encounter_id' => $prescription->encounter_id,
                    'item_id' => $service ? $service->id : null, // Use service catalogue ID
                    'item_type' => 'pharmacy',
                    'description' => $prescription->drug_name . 
                                   ($prescription->dosage ? " - {$prescription->dosage}" : '') . 
                                   ($prescription->frequency ? " {$prescription->frequency}" : '') .
                                   ($prescription->duration ? " for {$prescription->duration} days" : ''),
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'amount' => $amount,
                    'discount_amount' => 0,
                    'net_amount' => $amount,
                    'service_code' => $service ? $service->code : 'PHARM_PRESCRIPTION',
                    'reference_type' => 'prescription',
                    'reference_id' => $prescription->id,
                    'status' => 'unpaid',
                    'posted_at' => now(),
                ]);

                // Update billing account totals
                $this->updateBillingAccountTotals($billingAccount);
            });

            \Log::info('💊 Prescription billing generated successfully', [
                'prescription_id' => $prescription->id,
                'encounter_id' => $prescription->encounter_id,
                'billing_items_created' => \App\Models\BillingItem::where('encounter_id', $prescription->encounter_id)
                    ->where('reference_type', 'prescription')
                    ->where('reference_id', $prescription->id)
                    ->count(),
                'all_billing_items_for_encounter' => \App\Models\BillingItem::where('encounter_id', $prescription->encounter_id)->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to generate prescription billing', [
                'prescription_id' => $prescription->id,
                'error' => $e->getMessage()
            ]);
            // Don't fail the prescription creation if billing fails
        }
    }

    /**
     * Find matching medication service in service catalogue
     */
    private function findMedicationService($drugName)
    {
        // First try to find exact or partial match in medication services
        $service = \App\Models\ServiceCatalogue::where('category', 'medication')
            ->where('is_active', true)
            ->where('is_billable', true)
            ->where(function($query) use ($drugName) {
                $query->where('name', 'LIKE', "%{$drugName}%")
                      ->orWhere('description', 'LIKE', "%{$drugName}%");
            })
            ->first();

        // If no specific match found, try to find a generic medication service
        if (!$service) {
            $service = \App\Models\ServiceCatalogue::where('category', 'medication')
                ->where('is_active', true)
                ->where('is_billable', true)
                ->where('name', 'LIKE', '%medication%')
                ->orWhere('name', 'LIKE', '%prescription%')
                ->orWhere('name', 'LIKE', '%drug%')
                ->first();
        }

        return $service;
    }

    /**
     * Get default drug price when no service catalogue match is found
     */
    private function getDefaultDrugPrice($drugName)
    {
        // Try to find the drug in formulary as fallback
        $drug = \App\Models\DrugFormulary::where('name', 'LIKE', "%{$drugName}%")
            ->orWhere('generic_name', 'LIKE', "%{$drugName}%")
            ->first();

        if ($drug && $drug->unit_price) {
            return (float) $drug->unit_price;
        }

        // Default pricing based on common medications
        $defaultPrices = [
            'paracetamol' => 5.00,
            'ibuprofen' => 10.00,
            'amoxicillin' => 15.00,
            'metformin' => 20.00,
            'aspirin' => 8.00,
        ];

        $drugLower = strtolower($drugName);
        foreach ($defaultPrices as $drug => $price) {
            if (strpos($drugLower, $drug) !== false) {
                return $price;
            }
        }

        // Default pricing based on common medications
        $defaultPrices = [
            'paracetamol' => 5.00,
            'ibuprofen' => 10.00,
            'amoxicillin' => 15.00,
            'metformin' => 20.00,
            'aspirin' => 8.00,
        ];

        $drugLower = strtolower($drugName);
        foreach ($defaultPrices as $drug => $price) {
            if (strpos($drugLower, $drug) !== false) {
                return $price;
            }
        }

        // Default price if not found
        return 50.00;
    }

    /**
     * Create or get generic prescription service in service catalogue
     */
    private function getOrCreateGenericPrescriptionService()
    {
        return \App\Models\ServiceCatalogue::firstOrCreate(
            [
                'code' => 'MED999',
                'category' => 'medication'
            ],
            [
                'name' => 'General Prescription Medication',
                'description' => 'General prescription medication billing',
                'unit_price' => 50.00,
                'unit_of_measure' => 'prescription',
                'is_active' => true,
                'is_billable' => true,
            ]
        );
    }

    /**
     * Update billing account totals
     */
    private function updateBillingAccountTotals($billingAccount)
    {
        $totals = \App\Models\BillingItem::where('encounter_id', $billingAccount->encounter_id)
            ->selectRaw('
                SUM(amount) as total_amount,
                SUM(discount_amount) as total_discount,
                SUM(net_amount) as total_net_amount
            ')
            ->first();

        $totalAmount = $totals->total_amount ?? 0;
        $discountAmount = $totals->total_discount ?? 0;
        $netAmount = $totals->total_net_amount ?? 0;
        $amountPaid = $billingAccount->amount_paid ?? 0;
        $balance = $netAmount - $amountPaid;

        $billingAccount->update([
            'total_amount' => $totalAmount,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'balance' => $balance,
        ]);
    }

    /**
     * Generate consultation billing if it doesn't exist
     */
    private function generateConsultationBilling($appointmentId, $physicianId)
    {
        try {
            // Check if consultation charge already exists
            $existingConsultation = \App\Models\BillingItem::where('encounter_id', $appointmentId)
                ->where('item_type', 'consultation')
                ->first();

            if ($existingConsultation) {
                \Log::info('Consultation billing already exists', [
                    'appointment_id' => $appointmentId,
                    'billing_item_id' => $existingConsultation->id
                ]);
                return;
            }

            // Find a consultation service
            $service = \App\Models\ServiceCatalogue::where('category', 'like', '%consultation%')
                ->where('is_active', 1)
                ->where('is_billable', 1)
                ->orderByRaw("
                    CASE
                        WHEN name LIKE '%General Physician%' THEN 1
                        WHEN name LIKE '%General%' THEN 2
                        WHEN name LIKE '%OPD%' THEN 3
                        ELSE 4
                    END
                ")
                ->first();

            if (!$service) {
                \Log::warning('No consultation service found for billing', [
                    'appointment_id' => $appointmentId
                ]);
                return;
            }

            // Create consultation billing item
            $consultationItem = \App\Models\BillingItem::create([
                'encounter_id' => $appointmentId,
                'item_type' => 'consultation',
                'item_id' => $service->id,
                'description' => "OPD Consultation ({$service->name})",
                'quantity' => 1,
                'unit_price' => $service->unit_price,
                'amount' => $service->unit_price,
                'discount_amount' => 0,
                'net_amount' => $service->unit_price,
                'service_code' => $service->code,
                'reference_type' => 'physician',
                'reference_id' => $physicianId,
                'status' => 'unpaid',
                'posted_at' => now(),
            ]);

            // Update billing account totals
            $billingAccount = \App\Models\BillingAccount::where('encounter_id', $appointmentId)->first();
            if ($billingAccount) {
                $this->updateBillingAccountTotals($billingAccount);
            }

            \Log::info('Consultation billing generated successfully', [
                'appointment_id' => $appointmentId,
                'billing_item_id' => $consultationItem->id,
                'amount' => $consultationItem->amount
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to generate consultation billing', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage()
            ]);
            // Don't fail the prescription creation if consultation billing fails
        }
    }

}
