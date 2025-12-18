<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\OpdService;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\Icd10Code;

class OpdController extends Controller
{
    protected $opdService;

    public function __construct(OpdService $opdService)
    {
        $this->opdService = $opdService;
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
                    'doctor_name' => $item['doctor_name'] ?? 'Not assigned'
                ];
            }),
            'recentAppointments' => OpdAppointment::with(['patient', 'doctor'])
                ->whereDate('appointment_date', today())
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($appointment) {
                    return [
                        'id' => $appointment->id,
                        'appointment_number' => $appointment->appointment_number,
                        'patient' => [
                            'id' => $appointment->patient->id,
                            'first_name' => $appointment->patient->first_name,
                            'last_name' => $appointment->patient->last_name,
                        ],
                        'doctor' => [
                            'id' => $appointment->doctor->id,
                            'name' => $appointment->doctor->name,
                        ],
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
        // This would typically show prescriptions from completed consultations
        $appointments = OpdAppointment::with(['patient', 'doctor', 'latestSoapNote'])
            ->whereDate('appointment_date', today())
            ->where('status', 'COMPLETED')
            ->whereHas('latestSoapNote')
            ->orderBy('consultation_completed_at', 'desc')
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
                    // Check if prescription exists for this appointment
                    $prescription = \App\Models\Prescription::where('encounter_id', $appointment->id)->first();
                    
                    return [
                        'id' => $appointment->id,
                        'appointment_number' => $appointment->appointment_number,
                        'patient' => [
                            'id' => $appointment->patient->id,
                            'first_name' => $appointment->patient->first_name,
                            'last_name' => $appointment->patient->last_name,
                        ],
                        'doctor' => [
                            'id' => $appointment->doctor->id,
                            'name' => $appointment->doctor->name,
                        ],
                        'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                        'appointment_time' => $appointment->appointment_time ? 
                            \Carbon\Carbon::parse($appointment->appointment_time)->format('H:i') : null,
                        'status' => $appointment->status,
                        'consultation_completed_at' => $appointment->consultation_completed_at ? 
                            $appointment->consultation_completed_at->format('Y-m-d H:i:s') : null,
                        'prescription_status' => $prescription ? $prescription->status : 'pending',
                        'patient_id' => $appointment->patient_id,
                        'doctor_id' => $appointment->doctor_id,
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
            
            // Check if this is an AJAX/Inertia request
            if ($request->expectsJson() || $request->ajax() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Consultation completed successfully',
                    'data' => $result
                ]);
            }
            
            return redirect()->route('opd.consultations')->with('success', 'Consultation completed successfully');
        } catch (\Exception $e) {
            // Check if this is an AJAX/Inertia request
            if ($request->expectsJson() || $request->ajax() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to complete consultation: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to complete consultation: ' . $e->getMessage()]);
        }
    }

    /**
     * Edit SOAP notes for a consultation
     */
    public function editSoapNotes($appointmentId)
    {
        // First try to find OPD appointment
        $opdAppointment = OpdAppointment::with(['patient', 'doctor', 'latestSoapNote'])->find($appointmentId);
        
        if ($opdAppointment) {
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
                    'doctor' => $opdAppointment->doctor ? [
                        'id' => $opdAppointment->doctor->id,
                        'name' => $opdAppointment->doctor->name,
                    ] : null,
                    'status' => $opdAppointment->status,
                    'chief_complaint' => $opdAppointment->chief_complaint,
                ],
                'soapNote' => $opdAppointment->latestSoapNote
            ]);
        }

        // Try to find regular appointment
        $regularAppointment = \App\Models\Appointment::with(['patient', 'physician'])->find($appointmentId);
        
        if ($regularAppointment) {
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
                        'id' => $regularAppointment->physician->physician_code,
                        'name' => $regularAppointment->physician->name,
                    ] : null,
                    'status' => $regularAppointment->status,
                    'chief_complaint' => $regularAppointment->chief_complaint,
                ],
                'soapNote' => null // Regular appointments use different SOAP system
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
                    'created_at' => now()->toISOString(),
                    'created_by' => auth()->id() ?? 'system'
                ];

                $regularAppointment->update([
                    'appointment_notes' => json_encode($soapNotes)
                ]);

                return back()->with('success', 'SOAP notes saved successfully');
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
        $opdAppointment = OpdAppointment::with(['patient', 'doctor', 'latestSoapNote'])->find($appointmentId);
        
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
                    'doctor' => $opdAppointment->doctor ? [
                        'id' => $opdAppointment->doctor->id,
                        'name' => $opdAppointment->doctor->name,
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
                        'id' => $regularAppointment->physician->physician_code,
                        'name' => $regularAppointment->physician->name,
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
        $validated = $request->validate([
            'appointment_id' => 'required|integer',
            'patient_id' => 'required|string',
            'doctor_id' => 'required|string',
        ]);

        try {
            // Create or update prescription record for this appointment
            $prescription = \App\Models\Prescription::updateOrCreate(
                [
                    'encounter_id' => $validated['appointment_id'],
                    'patient_id' => $validated['patient_id'],
                ],
                [
                    'physician_id' => $validated['doctor_id'],
                    'drug_name' => 'From SOAP Notes', // This would be extracted from SOAP notes
                    'status' => 'verified', // Changed from pending to verified (sent to pharmacy)
                    'notes' => 'Sent to pharmacy on ' . now()->format('Y-m-d H:i:s'),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Prescription sent to pharmacy successfully',
                'data' => $prescription
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send prescription to pharmacy: ' . $e->getMessage()
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
                'recentAppointments' => OpdAppointment::with(['patient', 'doctor'])
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
                            'doctor' => $appointment->doctor ? [
                                'id' => $appointment->doctor->id,
                                'name' => $appointment->doctor->name,
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
}