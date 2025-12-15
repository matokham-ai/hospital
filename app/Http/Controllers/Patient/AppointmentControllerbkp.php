<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\Department;
use Carbon\Carbon;
use App\Events\AppointmentUpdated;
use App\Events\OpdAppointmentUpdated;
use App\Services\BillingService;


class AppointmentController extends Controller
{
    /**
     * Show appointment management page.
     */
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }


    public function index()
    {
        $today = now()->toDateString();

        $total = \App\Models\Appointment::count();
        $todayCount = \App\Models\Appointment::whereDate('appointment_date', $today)->count();
        $scheduled = \App\Models\Appointment::where('status', 'scheduled')->count();
        $completed = \App\Models\Appointment::where('status', 'completed')->count();
        $cancelled = \App\Models\Appointment::where('status', 'cancelled')->count();

        $latest = \App\Models\Appointment::with(['patient:id,first_name,last_name', 'physician:physician_code,name', 'department:deptid,name'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Appointments/Index', [
            'stats' => [
                'total' => $total,
                'today' => $todayCount,
                'scheduled' => $scheduled,
                'completed' => $completed,
                'cancelled' => $cancelled,
            ],
            'latest' => $latest->map(fn($a) => [
                'id' => $a->id,
                'patient' => $a->patient?->name,
                'doctor' => $a->physician?->name,
                'department' => $a->department?->name,
                'date' => $a->appointment_date ? \Carbon\Carbon::parse($a->appointment_date)->format('M j, Y') : null,
                'time' => $this->formatTime($a->appointment_time),
                'status' => ucfirst($a->status),
                'notes' => $a->appointment_notes,
            ]),

        ]);
    }


    /**
     * Show the create appointment form.
     */
    public function create()
    {
        return Inertia::render('Appointments/Create', [
            'patients' => Patient::select('id', 'first_name', 'last_name')->orderBy('first_name')->get()->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
            ]),
            'doctors' => Physician::select('physician_code as id', 'name', 'specialization')->orderBy('name')->get(),
            'departments' => Department::select('deptid as id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store new appointment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'     => 'required|exists:patients,id',
            'doctor_id'      => 'required|exists:physicians,physician_code',
            'department_id'  => 'required|exists:departments,deptid',
            'date'           => 'required|date|after_or_equal:today',
            'time'           => 'required',
            'notes'          => 'nullable|string|max:500',
        ]);

        $startTime = Carbon::parse("{$validated['date']} {$validated['time']}");
        $endTime = (clone $startTime)->addMinutes(30);

        // Check for conflicts
        $conflict = Appointment::where('physician_id', $validated['doctor_id'])
            ->whereBetween('appointment_date', [$validated['date'], $validated['date']])
            ->where('appointment_time', $validated['time'])
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'time' => 'This time slot is already booked for the selected doctor.'
            ])->onlyInput('time');
        }

        $appointment = Appointment::create([
            'patient_id' => $validated['patient_id'],
            'physician_id' => $validated['doctor_id'],
            'department_id' => $validated['department_id'],
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
            'appointment_notes' => $validated['notes'],
            'status' => 'SCHEDULED',
            'created_by' => auth()->id() ?? 'system',
        ]);

        // Broadcast the new appointment
        broadcast(new AppointmentUpdated($appointment, 'created'));

        try {
            // 💰 Add billing record directly
            $this->billingService->addConsultationCharge(
                $appointment->id,
                $appointment->physician_id,
                'OPD'
            );

            \Log::info('✅ Consultation charge created', [
                'appointment_id' => $appointment->id,
                'physician_id' => $appointment->physician_id
            ]);
        } catch (\Throwable $e) {
            \Log::error('❌ Consultation billing failed', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
        }


        return redirect()->route('web.appointments.index')
            ->with('success', 'Appointment booked successfully!');
    }

    /**
     * Fetch doctor's booked time slots for FullCalendar.
     */
    public function doctorEvents($doctorId)
    {
        $appointments = Appointment::where('physician_id', $doctorId)
            ->select('id', 'appointment_date', 'appointment_time', 'status')
            ->get();

        $events = $appointments->map(function ($a) {
            try {
                // Extract just the date part from appointment_date
                $dateStr = Carbon::parse($a->appointment_date)->format('Y-m-d');
                
                // Get the time, handling both time-only and datetime formats
                $timeStr = $a->appointment_time;
                if (strlen($timeStr) > 8) {
                    $timeStr = Carbon::parse($timeStr)->format('H:i:s');
                }
                
                // Create the start datetime
                $start = Carbon::parse("{$dateStr} {$timeStr}");
                $end = (clone $start)->addMinutes(30);
            } catch (\Exception $e) {
                // Skip invalid time entries
                \Log::warning('Invalid appointment time in doctorEvents', [
                    'appointment_id' => $a->id,
                    'date' => $a->appointment_date,
                    'time' => $a->appointment_time,
                    'error' => $e->getMessage()
                ]);
                return null;
            }
            return [
                'id' => $a->id,
                'title' => ucfirst($a->status),
                'start' => $start->format('Y-m-d\TH:i:s'),
                'end' => $end->format('Y-m-d\TH:i:s'),
                'backgroundColor' => match (strtolower($a->status)) {
                    'completed' => '#10b981',
                    'cancelled' => '#9ca3af',
                    'in_progress' => '#f59e0b',
                    default => '#3b82f6',
                },
                'borderColor' => '#ffffff',
                'textColor' => '#ffffff',
            ];
        });

        return response()->json($events->filter());
    }

    /**
     * Display all appointments (list).
     */
    public function list()
    {
        $appointments = Appointment::with(['patient:id,first_name,last_name', 'physician:physician_code,name', 'department:deptid,name'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'patient' => $a->patient?->name,
                    'doctor' => $a->physician?->name,
                    'department' => $a->department?->name,
                    'date' => Carbon::parse($a->appointment_date)->format('Y-m-d'),
                    'time' => $this->formatTime($a->appointment_time),
                    'status' => ucfirst($a->status),
                    'notes' => $a->appointment_notes,
                ];
            });

        return response()->json($appointments);
    }

    /**
     * Cancel appointment.
     */
    public function cancel($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'cancelled']);

        // Broadcast the cancellation
        broadcast(new AppointmentUpdated($appointment, 'cancelled'));

        return redirect()->back()->with('success', 'Appointment cancelled successfully.');
    }

    public function today(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $perPage = $request->get('per_page', 10);

        $query = Appointment::with(['patient:id,first_name,last_name', 'physician:physician_code,name'])
            ->whereDate('appointment_date', Carbon::today());

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient', function ($patientQuery) use ($search) {
                    $patientQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                })
                ->orWhereHas('physician', function ($physicianQuery) use ($search) {
                    $physicianQuery->where('name', 'like', "%{$search}%");
                })
                ->orWhere('appointment_time', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status && $status !== 'all') {
            $query->where('status', strtoupper($status));
        }

        $appointments = $query->orderBy('appointment_time')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Appointments/Today', [
            'appointments' => $appointments->through(fn($a) => [
                'id' => $a->id,
                'time' => $this->formatTime($a->appointment_time),
                'patient' => $a->patient?->name,
                'doctor' => $a->physician?->name,
                'status' => ucfirst($a->status),
            ]),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
            ],
            'stats' => [
                'total' => Appointment::whereDate('appointment_date', Carbon::today())->count(),
                'scheduled' => Appointment::whereDate('appointment_date', Carbon::today())->where('status', 'SCHEDULED')->count(),
                'completed' => Appointment::whereDate('appointment_date', Carbon::today())->where('status', 'COMPLETED')->count(),
                'cancelled' => Appointment::whereDate('appointment_date', Carbon::today())->where('status', 'CANCELLED')->count(),
                'in_progress' => Appointment::whereDate('appointment_date', Carbon::today())->where('status', 'IN_PROGRESS')->count(),
            ],
        ]);
    }

    public function calendar()
    {
        return Inertia::render('Appointments/Calendar');
    }

    /**
     * Get calendar events for all appointments (for web calendar view)
     */
    public function calendarEvents()
    {
        try {
            $user = auth()->user();

            // For now, let's show all appointments regardless of user role for debugging
            $appointments = Appointment::with(['patient.contacts'])
                ->whereNull('deleted_at')
                ->get(); // Remove status filter to see all appointments

            \Log::info('Calendar Events Debug', [
                'user_id' => $user ? $user->id : 'no user',
                'user_roles' => $user ? $user->getRoleNames() : 'no roles',
                'appointments_count' => $appointments->count(),
                'sample_appointment' => $appointments->first() ? [
                    'id' => $appointments->first()->id,
                    'date' => $appointments->first()->appointment_date,
                    'time' => $appointments->first()->appointment_time,
                    'status' => $appointments->first()->status,
                    'patient_id' => $appointments->first()->patient_id,
                ] : null
            ]);

        if ($appointments->isEmpty()) {
            \Log::info('No appointments found');
            return response()->json([]);
        }

        // Status-based color scheme
        $statusColors = [
            'SCHEDULED'   => '#3b82f6', // blue
            'CONFIRMED'   => '#10b981', // emerald
            'CHECKED_IN'  => '#8b5cf6', // violet
            'IN_PROGRESS' => '#f59e0b', // amber
            'COMPLETED'   => '#0284c7', // sky
            'CANCELLED'   => '#ef4444', // red
            'NO_SHOW'     => '#9ca3af', // gray
        ];

        $events = $appointments->map(function ($a) use ($statusColors) {
            try {
                // Get the date in Y-m-d format
                $dateStr = Carbon::parse($a->appointment_date)->format('Y-m-d');
                
                // Handle the time - extract just the time part
                $timeStr = $a->appointment_time;
                
                // If appointment_time is a full datetime, extract just the time
                if (strlen($timeStr) > 8) {
                    $timeStr = Carbon::parse($timeStr)->format('H:i:s');
                }
                
                // Fix invalid times like 24:00:00
                if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $timeStr, $matches)) {
                    $hour = (int)$matches[1];
                    if ($hour >= 24) {
                        $hour = $hour - 24; // Convert 24:00 to 00:00, etc.
                    }
                    $timeStr = sprintf('%02d:%s:%s', $hour, $matches[2], $matches[3]);
                }

                // Create proper ISO datetime strings
                $start = "{$dateStr}T{$timeStr}";
                
                // Calculate end time safely
                try {
                    $endDateTime = Carbon::parse("{$dateStr} {$timeStr}")->addMinutes(45);
                    $end = $endDateTime->format('Y-m-d\TH:i:s');
                } catch (\Exception $e) {
                    $end = $start; // fallback to same time
                }

                $status = strtoupper($a->status);
                $color = $statusColors[$status] ?? '#14b8a6'; // fallback teal

                $patient = $a->patient;
                $patientName = $patient ? trim($patient->first_name . ' ' . $patient->last_name) : 'Unknown Patient';
                $complaint = $a->chief_complaint ?: 'General consultation';

                return [
                    'id'        => $a->id,
                    'title'     => "{$patientName} – {$complaint}",
                    'start'     => $start,
                    'end'       => $end,
                    'color'     => $color,
                    'status'    => $status,
                    'extendedProps' => [
                        'appointmentId' => $a->id,
                        'patient' => $patient ? [
                            'id' => $patient->id,
                            'first_name' => $patient->first_name,
                            'last_name' => $patient->last_name,
                            'full_name' => $patientName,
                            'date_of_birth' => $patient->date_of_birth,
                            'gender' => $patient->gender,
                            'phone' => $patient->contacts->first()?->phone ?? 'N/A',
                            'allergies' => $patient->allergies ?? [],
                            'chronic_conditions' => $patient->chronic_conditions ?? [],
                            'alerts' => $patient->alerts ?? [],
                        ] : null,
                        'appointment' => [
                            'date' => $dateStr,
                            'time' => $timeStr,
                            'status' => $status,
                            'chief_complaint' => $complaint,
                            'notes' => $a->appointment_notes,
                            'physician_id' => $a->physician_id,
                            'department_id' => $a->department_id,
                        ],
                        'tooltip' => "Patient: {$patientName}\nStatus: {$status}\nComplaint: {$complaint}",
                    ],
                ];
            } catch (\Exception $e) {
                \Log::error('Calendar event error', [
                    'appointment_id' => $a->id,
                    'error' => $e->getMessage(),
                    'date' => $a->appointment_date,
                    'time' => $a->appointment_time
                ]);
                return null; // Skip invalid appointments
            }
        });

        $validEvents = $events->filter()->values();
        
        \Log::info('Calendar Events Result', [
            'total_events' => $validEvents->count(),
            'sample_event' => $validEvents->first()
        ]);

        return response()->json($validEvents);
        
        } catch (\Exception $e) {
            \Log::error('Calendar Events Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to load calendar events'], 500);
        }
    }

    /**
     * Start consultation - update appointment status to IN_PROGRESS
     */
    public function startConsultation(Request $request, $id)
    {
        try {
            \Log::info('DEBUG: Start Consultation Request', [
                'appointment_id' => $id,
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);

            // First check if this is a regular Appointment
            $appointment = Appointment::find($id);
            
            if (!$appointment) {
                \Log::info('DEBUG: Regular Appointment not found, checking OpdAppointment', [
                    'appointment_id' => $id
                ]);
                
                // Check if this is an OpdAppointment
                $opdAppointment = \App\Models\OpdAppointment::find($id);
                
                if ($opdAppointment) {
                    \Log::info('DEBUG: Found OpdAppointment', [
                        'opd_appointment' => $opdAppointment->toArray(),
                        'patient' => $opdAppointment->patient ? $opdAppointment->patient->toArray() : null
                    ]);
                    
                    // Convert OpdAppointment to regular Appointment format
                    return $this->handleOpdAppointmentConsultation($opdAppointment);
                }
                
                throw new \Exception("Appointment not found with ID: {$id}");
            }

            \Log::info('DEBUG: Found Regular Appointment', [
                'appointment' => $appointment->toArray(),
                'patient' => $appointment->patient ? $appointment->patient->toArray() : null
            ]);
            
            // Update status to IN_PROGRESS
            $appointment->update([
                'status' => 'IN_PROGRESS',
                'started_at' => now()
            ]);

            // Broadcast the status change
            broadcast(new AppointmentUpdated($appointment, 'status_changed'));

            // Load the appointment with patient data for the response
            $appointment->load(['patient.contacts']);

            $responseData = [
                'success' => true,
                'message' => 'Consultation started successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'started_at' => $appointment->started_at,
                    'patient' => [
                        'id' => $appointment->patient->id,
                        'full_name' => $appointment->patient->name,
                        'first_name' => $appointment->patient->first_name,
                        'last_name' => $appointment->patient->last_name,
                        'date_of_birth' => $appointment->patient->date_of_birth,
                        'gender' => $appointment->patient->gender,
                        'phone' => $appointment->patient->contacts->first()?->phone ?? 'N/A',
                        'allergies' => $appointment->patient->allergies ?? [],
                        'chronic_conditions' => $appointment->patient->chronic_conditions ?? [],
                        'alerts' => $appointment->patient->alerts ?? [],
                    ],
                    'appointment_details' => [
                        'date' => $appointment->appointment_date,
                        'time' => $appointment->appointment_time,
                        'chief_complaint' => $appointment->chief_complaint,
                        'notes' => $appointment->appointment_notes,
                    ]
                ]
            ];

            \Log::info('DEBUG: Start Consultation Response', $responseData);

            return response()->json($responseData);
        } catch (\Exception $e) {
            \Log::error('Start Consultation Error', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to start consultation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle OpdAppointment consultation
     */
    private function handleOpdAppointmentConsultation($opdAppointment)
    {
        try {
            // Update OpdAppointment status
            $opdAppointment->update([
                'status' => 'IN_PROGRESS',
                'consultation_started_at' => now()
            ]);

            // Broadcast the status change
            broadcast(new OpdAppointmentUpdated($opdAppointment, 'status_changed'));

            $opdAppointment->load(['patient']);

            $responseData = [
                'success' => true,
                'message' => 'OPD Consultation started successfully',
                'appointment' => [
                    'id' => $opdAppointment->id,
                    'status' => $opdAppointment->status,
                    'started_at' => $opdAppointment->consultation_started_at,
                    'patient' => [
                        'id' => $opdAppointment->patient->id,
                        'full_name' => $opdAppointment->patient->first_name . ' ' . $opdAppointment->patient->last_name,
                        'first_name' => $opdAppointment->patient->first_name,
                        'last_name' => $opdAppointment->patient->last_name,
                        'date_of_birth' => $opdAppointment->patient->date_of_birth,
                        'gender' => $opdAppointment->patient->gender,
                        'phone' => $opdAppointment->patient->phone ?? 'N/A',
                        'allergies' => $opdAppointment->patient->allergies ?? [],
                        'chronic_conditions' => $opdAppointment->patient->chronic_conditions ?? [],
                        'alerts' => $opdAppointment->patient->alerts ?? [],
                    ],
                    'appointment_details' => [
                        'date' => $opdAppointment->appointment_date,
                        'time' => $opdAppointment->appointment_time,
                        'chief_complaint' => $opdAppointment->chief_complaint,
                        'notes' => $opdAppointment->notes,
                    ]
                ]
            ];

            \Log::info('DEBUG: OPD Consultation Response', $responseData);

            return response()->json($responseData);
        } catch (\Exception $e) {
            \Log::error('OPD Consultation Error', [
                'opd_appointment_id' => $opdAppointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to start OPD consultation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete consultation - update appointment status to COMPLETED
     */
    public function completeConsultation(Request $request, $id)
    {
        try {
            \Log::info('DEBUG: Complete Consultation Request', [
                'appointment_id' => $id,
                'user_id' => auth()->id(),
                'request_url' => $request->fullUrl()
            ]);

            // First check if this is a regular Appointment
            $appointment = Appointment::find($id);
            
            if (!$appointment) {
                \Log::info('DEBUG: Regular Appointment not found, checking OpdAppointment', [
                    'appointment_id' => $id
                ]);
                
                // Check if this is an OpdAppointment
                $opdAppointment = \App\Models\OpdAppointment::find($id);
                
                if ($opdAppointment) {
                    return $this->completeOpdConsultation($opdAppointment);
                }
                
                throw new \Exception("Appointment not found with ID: {$id}");
            }
            
            // Update status to COMPLETED - this will remove it from the queue
            $appointment->update([
                'status' => 'COMPLETED',
                'completed_at' => now()
            ]);

            // Broadcast the status change
            broadcast(new AppointmentUpdated($appointment, 'completed'));

            try {
                $this->billingService->addConsultationCharge(
                    $opdAppointment->id,
                    $opdAppointment->physician_id,
                    'OPD'
                );

                \Log::info('✅ OPD Consultation charge created', [
                    'opd_appointment_id' => $opdAppointment->id,
                    'physician_id' => $opdAppointment->physician_id
                ]);
            } catch (\Throwable $e) {
                \Log::error('❌ OPD Consultation billing failed', [
                    'opd_appointment_id' => $opdAppointment->id,
                    'error' => $e->getMessage()
                ]);
            }

            

            \Log::info('DEBUG: Regular Consultation Completed - Removed from Queue', [
                'appointment_id' => $id,
                'status' => $appointment->status,
                'completed_at' => $appointment->completed_at
            ]);

            // Check if this is an AJAX/Inertia request
            if ($request->expectsJson() || $request->ajax() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Consultation completed successfully',
                    'appointment' => [
                        'id' => $appointment->id,
                        'status' => $appointment->status,
                        'completed_at' => $appointment->completed_at,
                    ]
                ]);
            }
            
            return redirect()->route('opd.consultations')->with('success', 'Consultation completed successfully');
        } catch (\Exception $e) {
            \Log::error('Complete Consultation Error', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
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
     * Complete consultation for an OPD appointment
     */
    private function completeOpdConsultation($opdAppointment)
    {
        try {
            // Update status to COMPLETED - this will remove it from the queue
            $updateResult = $opdAppointment->update([
                'status' => 'COMPLETED',
                'consultation_completed_at' => now()
            ]);

            // Broadcast the status change
            broadcast(new OpdAppointmentUpdated($opdAppointment, 'completed'));
            
            \Log::info('DEBUG: Model Update Result', [
                'update_result' => $updateResult,
                'appointment_id' => $opdAppointment->id
            ]);

            // If model update failed, try direct database update
            if (!$updateResult) {
                \Log::warning('Model update failed, trying direct database update');
                $directUpdate = \DB::table('opd_appointments')
                    ->where('id', $opdAppointment->id)
                    ->update([
                        'status' => 'COMPLETED',
                        'consultation_completed_at' => now(),
                        'updated_at' => now()
                    ]);
                \Log::info('Direct database update result', ['rows_affected' => $directUpdate]);
            }

            // Refresh the model to ensure we have the latest data
            $opdAppointment->refresh();
            
            // Double-check the database directly
            $dbStatus = \DB::table('opd_appointments')->where('id', $opdAppointment->id)->value('status');
            
            \Log::info('DEBUG: OPD Consultation Completed - Database Check', [
                'opd_appointment_id' => $opdAppointment->id,
                'model_status_before' => $opdAppointment->getOriginal('status'),
                'model_status_after' => $opdAppointment->status,
                'db_status' => $dbStatus,
                'completed_at' => $opdAppointment->consultation_completed_at,
                'update_successful' => $dbStatus === 'COMPLETED',
                'model_dirty' => $opdAppointment->isDirty(),
                'model_changes' => $opdAppointment->getChanges()
            ]);
            
            // If the database update failed, throw an error
            if ($dbStatus !== 'COMPLETED') {
                throw new \Exception("Database update failed. Expected status 'COMPLETED', got '{$dbStatus}'");
            }

            return response()->json([
                'success' => true,
                'message' => 'OPD consultation completed successfully',
                'appointment' => [
                    'id' => $opdAppointment->id,
                    'status' => $opdAppointment->status,
                    'completed_at' => $opdAppointment->consultation_completed_at,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Complete OPD Consultation Error', [
                'opd_appointment_id' => $opdAppointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete OPD consultation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save SOAP notes for an appointment
     */
    public function saveSOAPNotes(Request $request, $id)
    {
        try {
            \Log::info('DEBUG: Save SOAP Notes Request', [
                'appointment_id' => $id,
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);

            $validated = $request->validate([
                'subjective' => 'nullable|string',
                'objective' => 'nullable|string',
                'assessment' => 'nullable|string',
                'plan' => 'nullable|string',
            ]);

            // First check if this is a regular Appointment
            $appointment = Appointment::find($id);
            
            if (!$appointment) {
                \Log::info('DEBUG: Regular Appointment not found, checking OpdAppointment', [
                    'appointment_id' => $id
                ]);
                
                // Check if this is an OpdAppointment
                $opdAppointment = \App\Models\OpdAppointment::find($id);
                
                if ($opdAppointment) {
                    return $this->saveOpdSOAPNotes($opdAppointment, $validated);
                }
                
                throw new \Exception("Appointment not found with ID: {$id}");
            }
            
            // For now, we'll store SOAP notes in the appointment_notes field
            // In a production system, you'd want a separate clinical_notes table
            $soapNotes = [
                'subjective' => $validated['subjective'],
                'objective' => $validated['objective'],
                'assessment' => $validated['assessment'],
                'plan' => $validated['plan'],
                'created_at' => now()->toISOString(),
                'created_by' => auth()->id() ?? 'system'
            ];

            $appointment->update([
                'appointment_notes' => json_encode($soapNotes)
            ]);

            \Log::info('DEBUG: Regular Appointment SOAP Notes Saved', [
                'appointment_id' => $id,
                'soap_notes' => $soapNotes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SOAP notes saved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Save SOAP Notes Error', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save SOAP notes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appointment details for continuing consultation
     */
    public function show($id)
    {
        try {
            \Log::info('DEBUG: Get Appointment Details Request', [
                'appointment_id' => $id,
                'user_id' => auth()->id()
            ]);

            // First check if this is a regular Appointment
            $appointment = Appointment::with(['patient.contacts'])->find($id);
            
            if (!$appointment) {
                \Log::info('DEBUG: Regular Appointment not found, checking OpdAppointment', [
                    'appointment_id' => $id
                ]);
                
                // Check if this is an OpdAppointment
                $opdAppointment = \App\Models\OpdAppointment::with(['patient'])->find($id);
                
                if ($opdAppointment) {
                    return response()->json([
                        'id' => $opdAppointment->id,
                        'appointment_date' => $opdAppointment->appointment_date,
                        'appointment_time' => $opdAppointment->appointment_time,
                        'chief_complaint' => $opdAppointment->chief_complaint,
                        'appointment_notes' => $opdAppointment->notes,
                        'status' => $opdAppointment->status,
                        'patient' => [
                            'id' => $opdAppointment->patient->id,
                            'name' => $opdAppointment->patient->first_name . ' ' . $opdAppointment->patient->last_name,
                            'first_name' => $opdAppointment->patient->first_name,
                            'last_name' => $opdAppointment->patient->last_name,
                            'date_of_birth' => $opdAppointment->patient->date_of_birth,
                            'gender' => $opdAppointment->patient->gender,
                            'phone' => $opdAppointment->patient->phone ?? 'N/A',
                            'allergies' => $opdAppointment->patient->allergies ?? [],
                            'chronic_conditions' => $opdAppointment->patient->chronic_conditions ?? [],
                            'alerts' => $opdAppointment->patient->alerts ?? [],
                        ]
                    ]);
                }
                
                throw new \Exception("Appointment not found with ID: {$id}");
            }

            return response()->json([
                'id' => $appointment->id,
                'appointment_date' => $appointment->appointment_date,
                'appointment_time' => $appointment->appointment_time,
                'chief_complaint' => $appointment->chief_complaint,
                'appointment_notes' => $appointment->appointment_notes,
                'status' => $appointment->status,
                'patient' => [
                    'id' => $appointment->patient->id,
                    'name' => $appointment->patient->name,
                    'first_name' => $appointment->patient->first_name,
                    'last_name' => $appointment->patient->last_name,
                    'date_of_birth' => $appointment->patient->date_of_birth,
                    'gender' => $appointment->patient->gender,
                    'phone' => $appointment->patient->contacts->first()?->phone ?? 'N/A',
                    'allergies' => $appointment->patient->allergies ?? [],
                    'chronic_conditions' => $appointment->patient->chronic_conditions ?? [],
                    'alerts' => $appointment->patient->alerts ?? [],
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Get Appointment Details Error', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to get appointment details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save SOAP notes for an OPD appointment
     */
    private function saveOpdSOAPNotes($opdAppointment, $validated)
    {
        try {
            // For OPD appointments, we'll store SOAP notes in the notes field
            // In a production system, you'd want a separate clinical_notes table
            $soapNotes = [
                'subjective' => $validated['subjective'],
                'objective' => $validated['objective'],
                'assessment' => $validated['assessment'],
                'plan' => $validated['plan'],
                'created_at' => now()->toISOString(),
                'created_by' => auth()->id() ?? 'system'
            ];

            $opdAppointment->update([
                'notes' => json_encode($soapNotes)
            ]);

            \Log::info('DEBUG: OPD Appointment SOAP Notes Saved', [
                'opd_appointment_id' => $opdAppointment->id,
                'soap_notes' => $soapNotes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'OPD SOAP notes saved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Save OPD SOAP Notes Error', [
                'opd_appointment_id' => $opdAppointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save OPD SOAP notes: ' . $e->getMessage()
            ], 500);
        }
    }



    /**
     * Safely format time, handling invalid time values
     */
    private function formatTime($time)
    {
        try {
            return Carbon::parse($time)->format('H:i');
        } catch (\Exception $e) {
            // Return the original time if parsing fails, or a default
            return is_string($time) ? substr($time, 0, 5) : '00:00';
        }
    }


}

