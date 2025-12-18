<?php

namespace App\Services;

use App\Models\OpdAppointment;
use App\Models\OpdSoapNote;
use App\Models\OpdDiagnosis;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\LabOrder;
use App\Models\BillingItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OpdService
{
    protected $emergencyService;
    protected $prescriptionService;
    protected $labOrderService;
    protected $billingService;

    public function __construct(
        EmergencyService $emergencyService,
        PrescriptionService $prescriptionService,
        LabOrderService $labOrderService,
        BillingService $billingService
    ) {
        $this->emergencyService = $emergencyService;
        $this->prescriptionService = $prescriptionService;
        $this->labOrderService = $labOrderService;
        $this->billingService = $billingService;
    }

    public function registerPatient(array $patientData, array $appointmentData = [])
    {
        return DB::transaction(function () use ($patientData, $appointmentData) {
            // Create or find patient
            $patient = Patient::find($patientData['patient_id'] ?? null);
            
            if (!$patient) {
                throw new \Exception('Patient not found');
            }

            // Check if patient already has an active appointment today
            if ($this->hasActiveAppointmentToday($patient->id)) {
                $activeAppointments = $this->getActiveAppointmentsToday($patient->id);
                $activeAppointment = $activeAppointments->first();
                
                throw new \Exception("Patient already has an active appointment today (#{$activeAppointment->appointment_number}, Status: {$activeAppointment->status}). Please complete or cancel the existing appointment before creating a new one.");
            }

            // Create OPD appointment
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'appointment_date' => $appointmentData['appointment_date'] ?? today(),
                'appointment_time' => $appointmentData['appointment_time'] ?? null,
                'appointment_type' => $appointmentData['appointment_type'] ?? 'WALK_IN',
                'chief_complaint' => $appointmentData['chief_complaint'] ?? null,
                'notes' => $appointmentData['notes'] ?? null,
                'queue_number' => $this->getNextQueueNumber(),
                'checked_in_at' => now(),
                'status' => 'WAITING'
            ]);

            return $appointment;
        });
    }

    public function startConsultation($appointmentId, $doctorId = null)
    {
        $appointment = OpdAppointment::findOrFail($appointmentId);
        
        $appointment->startConsultation($doctorId);
        
        // Create initial SOAP note
        $soapNote = OpdSoapNote::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $doctorId,
            'is_draft' => true
        ]);

        // Retrieve emergency data if patient is an emergency patient
        $emergencyData = $this->emergencyService->getEmergencyDataForPatient($appointment->patient_id);
        
        $triageAssessment = null;
        if ($emergencyData) {
            $triageAssessment = $this->emergencyService->getLatestTriageAssessment($emergencyData->id);
        }

        return [
            'appointment' => $appointment->fresh(),
            'soap_note' => $soapNote,
            'emergency_data' => $emergencyData,
            'triage_assessment' => $triageAssessment,
            'is_emergency_patient' => $emergencyData !== null
        ];
    }

    public function saveSOAP($appointmentId, array $soapData)
    {
        return DB::transaction(function () use ($appointmentId, $soapData) {
            $appointment = OpdAppointment::findOrFail($appointmentId);
            
            $soapNote = $appointment->latestSoapNote ?? OpdSoapNote::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => auth()->id(),
                'is_draft' => true
            ]);

            // Extract medications from soapData
            $medications = $soapData['medications'] ?? [];
            unset($soapData['medications']); // Remove from SOAP data

            $soapNote->update($soapData);

            // Calculate BMI if weight and height are provided
            if (isset($soapData['weight']) && isset($soapData['height'])) {
                $soapNote->calculateBMI();
            }

            // Handle medications/prescriptions with instant dispensing support
            if (!empty($medications)) {
                // Clear existing prescriptions for this appointment
                $existingPrescriptions = Prescription::where('encounter_id', $appointmentId)->get();
                
                // Release stock for prescriptions with reserved stock before deleting
                foreach ($existingPrescriptions as $prescription) {
                    if ($prescription->stock_reserved) {
                        $this->prescriptionService->releaseStock($prescription);
                    }
                }
                
                $existingPrescriptions->each->delete();

                // Create new prescriptions
                foreach ($medications as $medication) {
                    if (!empty($medication['drug_name'])) {
                        $prescriptionData = [
                            'encounter_id' => $appointmentId,
                            'patient_id' => $appointment->patient_id,
                            'physician_id' => $appointment->doctor_id,
                            'drug_name' => $medication['drug_name'],
                            'dosage' => $medication['dosage'] ?? null,
                            'frequency' => $medication['frequency'] ?? null,
                            'duration' => $medication['duration'] ?? null,
                            'quantity' => $medication['quantity'] ?? null,
                            'status' => 'pending',
                            'notes' => $medication['instructions'] ?? null,
                            'prescription_data' => $medication,
                            'instant_dispensing' => $medication['instant_dispensing'] ?? false,
                            'drug_id' => $medication['drug_id'] ?? null,
                        ];
                        
                        // Use PrescriptionService to handle instant dispensing and stock reservation
                        try {
                            $this->prescriptionService->createPrescription($prescriptionData);
                        } catch (\Exception $e) {
                            Log::warning('Failed to create prescription with instant dispensing', [
                                'appointment_id' => $appointmentId,
                                'medication' => $medication,
                                'error' => $e->getMessage()
                            ]);
                            // Create without instant dispensing if it fails
                            $prescriptionData['instant_dispensing'] = false;
                            Prescription::create($prescriptionData);
                        }
                    }
                }

                Log::info('Prescriptions created for appointment', [
                    'appointment_id' => $appointmentId,
                    'medications_count' => count($medications)
                ]);
            }

            return $soapNote->fresh();
        });
    }

    /**
     * Get consultation summary before completion
     * 
     * @param int $appointmentId
     * @return array
     */
    public function getConsultationSummary(int $appointmentId): array
    {
        $appointment = OpdAppointment::findOrFail($appointmentId);
        
        // Get all prescriptions for this consultation
        $prescriptions = Prescription::where('encounter_id', $appointmentId)
            ->with('drugFormulary')
            ->get();
        
        // Get all lab orders for this consultation
        $labOrders = LabOrder::where('encounter_id', $appointmentId)
            ->with('testCatalog')
            ->get();
        
        // Separate instant dispensing prescriptions
        $instantDispensingPrescriptions = $prescriptions->where('instant_dispensing', true);
        $regularPrescriptions = $prescriptions->where('instant_dispensing', false);
        
        return [
            'appointment' => $appointment,
            'prescriptions' => $prescriptions,
            'regular_prescriptions' => $regularPrescriptions,
            'instant_dispensing_prescriptions' => $instantDispensingPrescriptions,
            'lab_orders' => $labOrders,
            'total_prescriptions' => $prescriptions->count(),
            'total_lab_orders' => $labOrders->count(),
        ];
    }

    /**
     * Reopen a completed consultation for modifications
     */
    public function reopenConsultation($appointmentId)
    {
        return DB::transaction(function () use ($appointmentId) {
            // First try to find OPD appointment
            $opdAppointment = OpdAppointment::find($appointmentId);
            
            if ($opdAppointment) {
                // Check if consultation is completed
                if ($opdAppointment->status !== 'COMPLETED') {
                    throw new \Exception('Consultation is not completed and cannot be reopened.');
                }

                // Reopen the appointment
                $opdAppointment->update([
                    'status' => 'IN_PROGRESS',
                    'consultation_completed_at' => null
                ]);

                Log::info('Consultation reopened', [
                    'appointment_id' => $appointmentId,
                    'reopened_by' => auth()->id(),
                    'reopened_at' => now()
                ]);

                return [
                    'type' => 'opd',
                    'appointment' => $opdAppointment->fresh(),
                    'message' => 'Consultation has been reopened for modifications'
                ];
            }

            // Try to find regular appointment
            $regularAppointment = \App\Models\Appointment::find($appointmentId);
            
            if ($regularAppointment) {
                // Check if consultation is completed
                if ($regularAppointment->status !== 'COMPLETED') {
                    throw new \Exception('Consultation is not completed and cannot be reopened.');
                }

                // Reopen the regular appointment
                $regularAppointment->update([
                    'status' => 'IN_PROGRESS',
                    'completed_at' => null
                ]);

                Log::info('Regular consultation reopened', [
                    'appointment_id' => $appointmentId,
                    'reopened_by' => auth()->id(),
                    'reopened_at' => now()
                ]);

                return [
                    'type' => 'regular',
                    'appointment' => $regularAppointment->fresh(),
                    'message' => 'Consultation has been reopened for modifications'
                ];
            }

            throw new \Exception("Appointment not found with ID: {$appointmentId}");
        });
    }

    public function completeConsultation($appointmentId, array $finalData = [])
    {
        return DB::transaction(function () use ($appointmentId, $finalData) {
            // First try to find OPD appointment
            $opdAppointment = OpdAppointment::find($appointmentId);
            
            if ($opdAppointment) {
                // Check if consultation is already completed
                if ($opdAppointment->status === 'COMPLETED') {
                    throw new \Exception('Consultation is already completed and cannot be modified.');
                }

                // Complete the SOAP note
                $soapNote = $opdAppointment->latestSoapNote;
                if ($soapNote) {
                    $soapNote->update($finalData);
                    $soapNote->complete();
                }

                // Process instant dispensing prescriptions
                $prescriptions = Prescription::where('encounter_id', $appointmentId)->get();
                foreach ($prescriptions as $prescription) {
                    if ($prescription->instant_dispensing && $prescription->stock_reserved) {
                        // Create dispensation record
                        DB::table('dispensations')->insert([
                            'prescription_id' => $prescription->id,
                            'dispensed_by' => auth()->id() ?? 1,
                            'quantity_dispensed' => $prescription->quantity,
                            'dispensed_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        // Update prescription status
                        $prescription->update(['status' => 'dispensed']);
                        
                        Log::info('Instant dispensing record created', [
                            'prescription_id' => $prescription->id,
                            'appointment_id' => $appointmentId,
                            'quantity' => $prescription->quantity
                        ]);
                    }
                }

                // Submit all lab orders to laboratory
                $labOrders = LabOrder::where('encounter_id', $appointmentId)->get();
                foreach ($labOrders as $labOrder) {
                    $this->labOrderService->submitToLaboratory($labOrder);
                }

                // Create billing items for prescriptions
                foreach ($prescriptions as $prescription) {
                    try {
                        if ($prescription->drugFormulary) {
                            $this->billingService->addMedicationCharge(
                                $appointmentId,
                                $prescription->drug_id,
                                $prescription->drugFormulary->name,
                                $prescription->quantity
                            );
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to create billing item for prescription', [
                            'prescription_id' => $prescription->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Create billing items for lab orders
                foreach ($labOrders as $labOrder) {
                    try {
                        $testName = $labOrder->testCatalog ? $labOrder->testCatalog->name : $labOrder->test_name;
                        $this->billingService->addLabTestCharge(
                            $appointmentId,
                            $labOrder->test_id,
                            $testName
                        );
                    } catch (\Exception $e) {
                        Log::warning('Failed to create billing item for lab order', [
                            'lab_order_id' => $labOrder->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Create consultation charge - This is the main billing item that was missing!
                try {
                    // Check if consultation charge already exists to prevent duplicates
                    $existingConsultationCharge = \App\Models\BillingItem::where('encounter_id', $appointmentId)
                        ->where('item_type', 'consultation')
                        ->first();
                    
                    if (!$existingConsultationCharge) {
                        $physicianId = $opdAppointment->physician_id ?? $opdAppointment->doctor_id ?? auth()->id();
                        $consultationType = $opdAppointment->appointment_type === 'EMERGENCY' ? 'Emergency' : 'OPD';
                        
                        $this->billingService->addConsultationCharge(
                            $appointmentId,
                            $physicianId,
                            $consultationType
                        );
                        
                        Log::info('Consultation charge created successfully', [
                            'appointment_id' => $appointmentId,
                            'physician_id' => $physicianId,
                            'consultation_type' => $consultationType
                        ]);
                    } else {
                        Log::info('Consultation charge already exists, skipping', [
                            'appointment_id' => $appointmentId,
                            'existing_charge_id' => $existingConsultationCharge->id
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to create consultation charge', [
                        'appointment_id' => $appointmentId,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    // Don't throw here - we want the consultation to complete even if billing fails
                }

                // Complete the appointment
                $opdAppointment->completeConsultation();

                return [
                    'type' => 'opd',
                    'appointment' => $opdAppointment->fresh(),
                    'soap_note' => $soapNote ? $soapNote->fresh() : null,
                    'prescriptions_processed' => $prescriptions->count(),
                    'lab_orders_submitted' => $labOrders->count(),
                ];
            }

            // Try to find regular appointment
            $regularAppointment = \App\Models\Appointment::find($appointmentId);
            
            if ($regularAppointment) {
                // Get prescriptions and lab orders for regular appointments
                $prescriptions = Prescription::where('encounter_id', $appointmentId)->get();
                $labOrders = LabOrder::where('encounter_id', $appointmentId)->get();

                // Create billing items for prescriptions
                foreach ($prescriptions as $prescription) {
                    try {
                        if ($prescription->drugFormulary) {
                            $this->billingService->addMedicationCharge(
                                $appointmentId,
                                $prescription->drug_id,
                                $prescription->drugFormulary->name,
                                $prescription->quantity
                            );
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to create billing item for prescription (regular appointment)', [
                            'prescription_id' => $prescription->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Create billing items for lab orders
                foreach ($labOrders as $labOrder) {
                    try {
                        $testName = $labOrder->testCatalog ? $labOrder->testCatalog->name : $labOrder->test_name;
                        $this->billingService->addLabTestCharge(
                            $appointmentId,
                            $labOrder->test_id,
                            $testName
                        );
                    } catch (\Exception $e) {
                        Log::warning('Failed to create billing item for lab order (regular appointment)', [
                            'lab_order_id' => $labOrder->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Create consultation charge for regular appointment
                try {
                    // Check if consultation charge already exists to prevent duplicates
                    $existingConsultationCharge = \App\Models\BillingItem::where('encounter_id', $appointmentId)
                        ->where('item_type', 'consultation')
                        ->first();
                    
                    if (!$existingConsultationCharge) {
                        $physicianId = $regularAppointment->physician_id ?? auth()->id();
                        $consultationType = $regularAppointment->appointment_type === 'EMERGENCY' ? 'Emergency' : 'Specialist';
                        
                        $this->billingService->addConsultationCharge(
                            $appointmentId,
                            $physicianId,
                            $consultationType
                        );
                        
                        Log::info('Consultation charge created successfully (regular appointment)', [
                            'appointment_id' => $appointmentId,
                            'physician_id' => $physicianId,
                            'consultation_type' => $consultationType
                        ]);
                    } else {
                        Log::info('Consultation charge already exists, skipping (regular appointment)', [
                            'appointment_id' => $appointmentId,
                            'existing_charge_id' => $existingConsultationCharge->id
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to create consultation charge (regular appointment)', [
                        'appointment_id' => $appointmentId,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }

                // Complete the regular appointment
                $regularAppointment->update([
                    'status' => 'COMPLETED',
                    'completed_at' => now()
                ]);

                return [
                    'type' => 'regular',
                    'appointment' => $regularAppointment->fresh(),
                    'soap_note' => null,
                    'prescriptions_processed' => $prescriptions->count(),
                    'lab_orders_submitted' => $labOrders->count(),
                ];
            }

            throw new \Exception("Appointment not found with ID: {$appointmentId}");
        });
    }

    public function getDashboardStats($date = null)
    {
        $date = $date ? Carbon::parse($date) : today();

        // Count OPD appointments
        $opdAppointments = OpdAppointment::whereDate('appointment_date', $date)->count();
        
        // Count scheduled appointments
        $scheduledAppointments = \App\Models\Appointment::whereDate('appointment_date', $date)->count();

        return [
            'today_appointments' => $opdAppointments + $scheduledAppointments,
            'waiting_patients' => OpdAppointment::whereDate('appointment_date', $date)
                                                ->where('status', 'WAITING')
                                                ->count() +
                                \App\Models\Appointment::whereDate('appointment_date', $date)
                                                ->where('status', 'SCHEDULED')
                                                ->count(),
            'in_progress' => OpdAppointment::whereDate('appointment_date', $date)
                                          ->where('status', 'IN_PROGRESS')
                                          ->count() +
                           \App\Models\Appointment::whereDate('appointment_date', $date)
                                          ->where('status', 'IN_PROGRESS')
                                          ->count(),
            'completed_today' => OpdAppointment::whereDate('appointment_date', $date)
                                              ->where('status', 'COMPLETED')
                                              ->count() +
                               \App\Models\Appointment::whereDate('appointment_date', $date)
                                              ->where('status', 'COMPLETED')
                                              ->count(),
            'average_waiting_time' => $this->getAverageWaitingTime($date),
            'queue' => $this->getTodayQueue($date)
        ];
    }

    public function getTodayQueue($date = null)
    {
        $date = $date ? Carbon::parse($date) : today();

        // Get OPD appointments (walk-ins and checked-in scheduled patients)
        $opdAppointments = OpdAppointment::with(['patient', 'emergencyPatient', 'doctor'])
            ->whereDate('appointment_date', $date)
            ->whereIn('status', ['WAITING', 'IN_PROGRESS'])
            ->orderBy('queue_number')
            ->get();

        // Get scheduled appointments that haven't been checked in yet
        $scheduledAppointments = \App\Models\Appointment::with(['patient', 'physician'])
            ->whereDate('appointment_date', $date)
            ->where('status', 'SCHEDULED')
            ->orderBy('appointment_time')
            ->get();

        \Log::info('DEBUG: Queue Query Results', [
            'date' => $date->toDateString(),
            'opd_appointments_found' => $opdAppointments->count(),
            'scheduled_appointments_found' => $scheduledAppointments->count(),
        ]);

        $queueItems = collect();

        // Add OPD appointments to queue
        $opdAppointments->each(function ($appointment) use ($queueItems) {
            // Format appointment time consistently
            $formattedTime = null;
            if ($appointment->appointment_time) {
                try {
                    $formattedTime = Carbon::parse($appointment->appointment_time)->format('H:i');
                } catch (\Exception $e) {
                    $formattedTime = $appointment->appointment_time;
                }
            }

            // Get patient name from either patient or emergency patient
            $patientName = 'Unknown Patient';
            if ($appointment->patient) {
                $patientName = $appointment->patient->first_name . ' ' . $appointment->patient->last_name;
            } elseif ($appointment->emergencyPatient) {
                $patientName = $appointment->emergencyPatient->temp_name;
            }

            $queueItems->push([
                'id' => $appointment->id,
                'type' => 'opd',
                'queue_number' => $appointment->queue_number,
                'patient_name' => $patientName,
                'patient_id' => $appointment->patient_id,
                'emergency_patient_id' => $appointment->emergency_patient_id,
                'appointment_number' => $appointment->appointment_number,
                'chief_complaint' => $appointment->chief_complaint,
                'status' => $appointment->status,
                'triage_status' => $appointment->triage_status,
                'triage_level' => $appointment->triage_level,
                'triage_score' => $appointment->triage_score,
                'checked_in_at' => $appointment->checked_in_at,
                'waiting_time' => $appointment->waiting_time,
                'doctor_name' => $appointment->doctor ? $appointment->doctor->name : null,
                'appointment_time' => $formattedTime
            ]);
        });

        // Add scheduled appointments to queue (they need to check in)
        $scheduledAppointments->each(function ($appointment) use ($queueItems) {
            // Format appointment time consistently
            $formattedTime = null;
            if ($appointment->appointment_time) {
                try {
                    $formattedTime = Carbon::parse($appointment->appointment_time)->format('H:i');
                } catch (\Exception $e) {
                    $formattedTime = $appointment->appointment_time;
                }
            }

            $queueItems->push([
                'id' => $appointment->id,
                'type' => 'scheduled',
                'queue_number' => null, // Will get assigned when checked in
                'patient_name' => $appointment->patient ? 
                    $appointment->patient->first_name . ' ' . $appointment->patient->last_name : 
                    'Unknown Patient',
                'patient_id' => $appointment->patient_id,
                'appointment_number' => $appointment->appointment_number,
                'chief_complaint' => $appointment->chief_complaint,
                'status' => 'SCHEDULED', // Show as scheduled until checked in
                'checked_in_at' => null,
                'waiting_time' => 0,
                'doctor_name' => $appointment->physician ? $appointment->physician->name : null,
                'appointment_time' => $formattedTime
            ]);
        });

        // Sort by triage priority first, then by appointment time/queue number
        $triageService = new \App\Services\TriageService();
        
        return $queueItems->sortBy(function ($item) use ($triageService) {
            // Priority 1: Triage level (emergency first)
            $triagePriority = 999;
            if (isset($item['triage_level'])) {
                $triagePriority = $triageService->getPriorityOrder($item['triage_level']);
            }
            
            // Priority 2: Status (in progress, waiting, scheduled)
            $statusPriority = match($item['status']) {
                'IN_PROGRESS' => 1,
                'WAITING' => 2,
                'SCHEDULED' => 3,
                default => 4,
            };
            
            // Priority 3: Time/Queue number
            $timePriority = $item['status'] === 'SCHEDULED' 
                ? $item['appointment_time'] ?? '23:59:59'
                : str_pad($item['queue_number'] ?? 999, 3, '0', STR_PAD_LEFT);
            
            // Combine priorities: triage_level.status.time
            return sprintf('%02d.%d.%s', $triagePriority, $statusPriority, $timePriority);
        })->values();
    }



    private function getNextQueueNumber()
    {
        $lastQueue = OpdAppointment::whereDate('appointment_date', today())
                                  ->max('queue_number');
        return ($lastQueue ?? 0) + 1;
    }

    /**
     * Check if patient already has an active appointment today
     */
    public function hasActiveAppointmentToday($patientId, $excludeAppointmentId = null)
    {
        $query = OpdAppointment::where('patient_id', $patientId)
                              ->whereDate('appointment_date', today())
                              ->whereIn('status', ['WAITING', 'IN_PROGRESS']);
        
        if ($excludeAppointmentId) {
            $query->where('id', '!=', $excludeAppointmentId);
        }
        
        return $query->exists();
    }

    /**
     * Get patient's active appointments today
     */
    public function getActiveAppointmentsToday($patientId)
    {
        return OpdAppointment::where('patient_id', $patientId)
                            ->whereDate('appointment_date', today())
                            ->whereIn('status', ['WAITING', 'IN_PROGRESS'])
                            ->get();
    }

    public function checkInScheduledAppointment($appointmentId)
    {
        return DB::transaction(function () use ($appointmentId) {
            // Find the scheduled appointment
            $scheduledAppointment = \App\Models\Appointment::findOrFail($appointmentId);
            
            // Check if appointment is already checked in
            if ($scheduledAppointment->status === 'CHECKED_IN') {
                // Find the existing OPD appointment
                $existingOpdAppointment = OpdAppointment::where('appointment_number', $scheduledAppointment->appointment_number)->first();
                
                if ($existingOpdAppointment) {
                    \Log::info('✅ Appointment already checked in, returning existing OPD appointment', [
                        'scheduled_appointment_id' => $appointmentId,
                        'existing_opd_appointment_id' => $existingOpdAppointment->id,
                        'appointment_number' => $scheduledAppointment->appointment_number
                    ]);
                    
                    return $existingOpdAppointment;
                } else {
                    throw new \Exception("Appointment is marked as checked in but no OPD appointment found. Please contact system administrator.");
                }
            }
            
            if ($scheduledAppointment->status !== 'SCHEDULED') {
                throw new \Exception("Cannot check in appointment. Current status is '{$scheduledAppointment->status}', but only 'SCHEDULED' appointments can be checked in.");
            }

            // Check if patient already has an active appointment today
            if ($this->hasActiveAppointmentToday($scheduledAppointment->patient_id)) {
                $activeAppointments = $this->getActiveAppointmentsToday($scheduledAppointment->patient_id);
                $activeAppointment = $activeAppointments->first();
                
                throw new \Exception("Patient already has an active appointment today (#{$activeAppointment->appointment_number}, Status: {$activeAppointment->status}). Please complete or cancel the existing appointment before checking in a new one.");
            }

            // Check if OPD appointment already exists for this scheduled appointment
            $existingOpdAppointment = OpdAppointment::where('appointment_number', $scheduledAppointment->appointment_number)->first();
            
            if ($existingOpdAppointment) {
                \Log::info('🔄 OPD appointment already exists, updating status', [
                    'scheduled_appointment_id' => $appointmentId,
                    'existing_opd_appointment_id' => $existingOpdAppointment->id,
                    'appointment_number' => $scheduledAppointment->appointment_number
                ]);
                
                // If OPD appointment already exists, just update the scheduled appointment status and return the existing OPD appointment
                $scheduledAppointment->update([
                    'status' => 'CHECKED_IN',
                    'checked_in_at' => now()
                ]);
                
                // Update the existing OPD appointment status if needed
                if ($existingOpdAppointment->status !== 'WAITING') {
                    $existingOpdAppointment->update([
                        'status' => 'WAITING',
                        'checked_in_at' => now()
                    ]);
                }
                
                return $existingOpdAppointment;
            }

            \Log::info('🆕 Creating new OPD appointment from scheduled appointment', [
                'scheduled_appointment_id' => $appointmentId,
                'appointment_number' => $scheduledAppointment->appointment_number
            ]);

            // Create OPD appointment from scheduled appointment
            $opdAppointment = OpdAppointment::create([
                'appointment_number' => $scheduledAppointment->appointment_number,
                'patient_id' => $scheduledAppointment->patient_id,
                'doctor_id' => $scheduledAppointment->physician_id,
                'appointment_date' => $scheduledAppointment->appointment_date,
                'appointment_time' => $scheduledAppointment->appointment_time,
                'appointment_type' => $scheduledAppointment->appointment_type,
                'chief_complaint' => $scheduledAppointment->chief_complaint,
                'notes' => $scheduledAppointment->appointment_notes,
                'queue_number' => $this->getNextQueueNumber(),
                'checked_in_at' => now(),
                'status' => 'WAITING'
            ]);

            // Update the original appointment status
            $scheduledAppointment->update([
                'status' => 'CHECKED_IN',
                'checked_in_at' => now()
            ]);

            return $opdAppointment;
        });
    }

    public function getTodayConsultations($date = null)
    {
        $date = $date ? Carbon::parse($date) : today();

        $consultations = collect();

        // Get OPD appointments that are in progress or completed
        $opdAppointments = OpdAppointment::with(['patient', 'emergencyPatient', 'doctor', 'latestSoapNote'])
            ->whereDate('appointment_date', $date)
            ->whereIn('status', ['IN_PROGRESS', 'COMPLETED'])
            ->get();

        // Get regular appointments that are in progress or completed
        $regularAppointments = \App\Models\Appointment::with(['patient', 'physician'])
            ->whereDate('appointment_date', $date)
            ->whereIn('status', ['IN_PROGRESS', 'COMPLETED'])
            ->get();

        // Add OPD appointments to consultations
        $opdAppointments->each(function ($appointment) use ($consultations) {
            // Get patient data from either patient or emergency patient
            $patientData = null;
            if ($appointment->patient) {
                $patientData = [
                    'id' => $appointment->patient->id,
                    'first_name' => $appointment->patient->first_name,
                    'last_name' => $appointment->patient->last_name,
                ];
            } elseif ($appointment->emergencyPatient) {
                // Parse temp_name for emergency patients
                $nameParts = explode(' ', $appointment->emergencyPatient->temp_name, 2);
                $patientData = [
                    'id' => $appointment->emergencyPatient->id,
                    'first_name' => $nameParts[0] ?? 'Emergency',
                    'last_name' => $nameParts[1] ?? 'Patient',
                ];
            }

            if ($patientData) {
                $consultations->push([
                    'id' => $appointment->id,
                    'type' => 'opd',
                    'appointment_number' => $appointment->appointment_number,
                    'patient' => $patientData,
                    'doctor' => $appointment->doctor ? [
                        'id' => $appointment->doctor->id,
                        'name' => $appointment->doctor->name,
                    ] : null,
                    'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                    'appointment_time' => $appointment->appointment_time ? 
                        Carbon::parse($appointment->appointment_time)->format('H:i') : null,
                    'status' => $appointment->status,
                    'chief_complaint' => $appointment->chief_complaint,
                    'queue_number' => $appointment->queue_number,
                    'consultation_started_at' => $appointment->consultation_started_at ? 
                        $appointment->consultation_started_at->format('Y-m-d H:i:s') : null,
                    'consultation_completed_at' => $appointment->consultation_completed_at ? 
                        $appointment->consultation_completed_at->format('Y-m-d H:i:s') : null,
                    'has_soap_notes' => $appointment->latestSoapNote !== null,
                ]);
            }
        });

        // Add regular appointments to consultations
        $regularAppointments->each(function ($appointment) use ($consultations) {
            $consultations->push([
                'id' => $appointment->id,
                'type' => 'regular',
                'appointment_number' => $appointment->appointment_number,
                'patient' => [
                    'id' => $appointment->patient->id,
                    'first_name' => $appointment->patient->first_name,
                    'last_name' => $appointment->patient->last_name,
                ],
                'doctor' => $appointment->physician ? [
                    'id' => $appointment->physician->physician_code,
                    'name' => $appointment->physician->name,
                ] : null,
                'appointment_date' => $appointment->appointment_date,
                'appointment_time' => $appointment->appointment_time ? 
                    Carbon::parse($appointment->appointment_time)->format('H:i') : null,
                'status' => $appointment->status,
                'chief_complaint' => $appointment->chief_complaint,
                'queue_number' => null, // Regular appointments don't have queue numbers
                'consultation_started_at' => $appointment->started_at ? 
                    Carbon::parse($appointment->started_at)->format('Y-m-d H:i:s') : null,
                'consultation_completed_at' => $appointment->completed_at ? 
                    Carbon::parse($appointment->completed_at)->format('Y-m-d H:i:s') : null,
                'has_soap_notes' => false, // Regular appointments use different SOAP system
            ]);
        });

        // Sort by consultation started time (most recent first)
        return $consultations->sortByDesc(function ($item) {
            return $item['consultation_started_at'] ?? '1970-01-01 00:00:00';
        })->values();
    }

    private function getAverageWaitingTime($date)
    {
        $completedAppointments = OpdAppointment::whereDate('appointment_date', $date)
            ->where('status', 'COMPLETED')
            ->whereNotNull('checked_in_at')
            ->whereNotNull('consultation_started_at')
            ->get();

        if ($completedAppointments->isEmpty()) {
            return 0;
        }

        $totalWaitingTime = $completedAppointments->sum('waiting_time');
        return round($totalWaitingTime / $completedAppointments->count());
    }
}