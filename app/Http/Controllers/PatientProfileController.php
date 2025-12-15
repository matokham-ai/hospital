<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\OpdAppointment;
use App\Models\Appointment;
use App\Models\Encounter;
use App\Models\VitalSign;
use App\Models\Prescription;
use App\Models\LabOrder;
use App\Models\ImagingOrder;
use App\Models\Diagnosis;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatientProfileController extends Controller
{
    public function show($id)
    {
        $patient = Patient::with([
            'addresses',
            'contacts'
        ])->findOrFail($id);

        // Get all appointments (OPD and regular)
        $opdAppointments = OpdAppointment::with(['physician'])
            ->where('patient_id', $id)
            ->orderBy('appointment_date', 'desc')
            ->get();

        $regularAppointments = Appointment::with(['physician'])
            ->where('patient_id', $id)
            ->orderBy('appointment_date', 'desc')
            ->get();

        // Get encounters (inpatient admissions)
        $encounters = Encounter::with(['bedAssignments.bed.ward'])
            ->where('patient_id', $id)
            ->orderBy('admission_datetime', 'desc')
            ->get();

        // Get vital signs through encounters
        $encounterIds = $encounters->pluck('id');
        $vitalSigns = VitalSign::whereIn('encounter_id', $encounterIds)
            ->orderBy('recorded_at', 'desc')
            ->take(10)
            ->get();

        // Also get vital signs from OPD triage
        $opdVitals = $opdAppointments->filter(function($apt) {
            return $apt->triage_status === 'completed' && $apt->temperature;
        })->map(function($apt) {
            return (object)[
                'id' => 'opd-' . $apt->id,
                'recorded_at' => $apt->triaged_at,
                'temperature' => $apt->temperature,
                'systolic_bp' => null,
                'diastolic_bp' => null,
                'blood_pressure_raw' => $apt->blood_pressure,
                'heart_rate' => $apt->heart_rate,
                'respiratory_rate' => $apt->respiratory_rate,
                'oxygen_saturation' => $apt->oxygen_saturation,
                'weight' => $apt->weight,
                'height' => $apt->height,
                'bmi' => null,
            ];
        });

        // Merge and sort all vitals
        $allVitals = $vitalSigns->concat($opdVitals)->sortByDesc(function($vital) {
            return $vital->recorded_at;
        })->take(10);

        // Get prescriptions
        $prescriptions = Prescription::with(['physician'])
            ->where('patient_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        // Get lab orders
        $labOrders = LabOrder::where('patient_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        // Get imaging orders
        $imagingOrders = ImagingOrder::where('patient_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        // Get diagnoses from encounters (inpatient)
        $inpatientDiagnoses = Diagnosis::with(['encounter'])
            ->whereIn('encounter_id', $encounterIds)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get OPD diagnoses
        $opdDiagnoses = \App\Models\OpdDiagnosis::where('patient_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Merge all diagnoses
        $diagnoses = $inpatientDiagnoses->concat($opdDiagnoses)->sortByDesc('created_at');

        return Inertia::render('Patients/Profile', [
            'patient' => [
                'id' => $patient->id,
                'medical_record_number' => $patient->medical_record_number,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'name' => $patient->name,
                'date_of_birth' => $patient->date_of_birth,
                'age' => $patient->age,
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'address' => $patient->addresses->first()?->address_line1 ?? 'N/A',
                'city' => $patient->addresses->first()?->city ?? 'N/A',
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
                'blood_group' => $patient->blood_group ?? 'N/A',
                'allergies' => $patient->allergies ?? 'None',
                'created_at' => $patient->created_at->format('Y-m-d'),
            ],
            'appointments' => [
                'opd' => $opdAppointments->map(function ($apt) {
                    return [
                        'id' => $apt->id,
                        'type' => 'OPD',
                        'appointment_number' => $apt->appointment_number,
                        'date' => $apt->appointment_date->format('Y-m-d'),
                        'time' => $apt->appointment_time,
                        'status' => $apt->status,
                        'chief_complaint' => $apt->chief_complaint,
                        'doctor' => $apt->physician?->name ?? 'N/A',
                        'triage_status' => $apt->triage_status,
                    ];
                }),
                'regular' => $regularAppointments->map(function ($apt) {
                    return [
                        'id' => $apt->id,
                        'type' => 'Scheduled',
                        'appointment_number' => $apt->appointment_number ?? "APT{$apt->id}",
                        'date' => $apt->appointment_date->format('Y-m-d'),
                        'time' => $apt->appointment_time,
                        'status' => $apt->status,
                        'chief_complaint' => $apt->chief_complaint ?? 'N/A',
                        'doctor' => $apt->physician?->name ?? 'N/A',
                    ];
                }),
            ],
            'encounters' => $encounters->map(function ($enc) {
                // Handle admission_datetime - check if it's a string or Carbon object
                $admissionDate = 'N/A';
                if ($enc->admission_datetime) {
                    $admissionDate = is_string($enc->admission_datetime)
                        ? $enc->admission_datetime
                        : $enc->admission_datetime->format('Y-m-d H:i');
                }

                // Handle discharge_datetime
                $dischargeDate = null;
                if ($enc->discharge_datetime) {
                    $dischargeDate = is_string($enc->discharge_datetime)
                        ? $enc->discharge_datetime
                        : $enc->discharge_datetime->format('Y-m-d H:i');
                }

                return [
                    'id' => $enc->id,
                    'encounter_number' => $enc->encounter_number,
                    'type' => $enc->type,
                    'admission_date' => $admissionDate,
                    'discharge_date' => $dischargeDate,
                    'status' => $enc->status,
                    'ward' => $enc->bedAssignments->first()?->bed?->ward?->name ?? 'N/A',
                    'bed' => $enc->bedAssignments->first()?->bed?->bed_number ?? 'N/A',
                    'admission_reason' => $enc->chief_complaint ?? $enc->admission_notes ?? 'N/A',
                    'priority' => $enc->priority ?? 'NORMAL',
                ];
            }),
            'vitalSigns' => $allVitals->map(function ($vital) {
                $bloodPressure = 'N/A';
                if (isset($vital->blood_pressure_raw)) {
                    $bloodPressure = $vital->blood_pressure_raw;
                } elseif ($vital->systolic_bp && $vital->diastolic_bp) {
                    $bloodPressure = $vital->systolic_bp . '/' . $vital->diastolic_bp;
                }

                return [
                    'id' => $vital->id,
                    'recorded_at' => is_string($vital->recorded_at) ? $vital->recorded_at : $vital->recorded_at->format('Y-m-d H:i'),
                    'temperature' => $vital->temperature ?? 'N/A',
                    'blood_pressure' => $bloodPressure,
                    'heart_rate' => $vital->heart_rate ?? 'N/A',
                    'respiratory_rate' => $vital->respiratory_rate ?? 'N/A',
                    'oxygen_saturation' => $vital->oxygen_saturation ?? 'N/A',
                    'weight' => $vital->weight ?? 'N/A',
                    'height' => $vital->height ?? 'N/A',
                    'bmi' => $vital->bmi ?? 'N/A',
                ];
            })->values(),
            'prescriptions' => $prescriptions->map(function ($rx) {
                return [
                    'id' => $rx->id,
                    'drug_name' => $rx->drug_name,
                    'dosage' => $rx->dosage,
                    'frequency' => $rx->frequency,
                    'duration' => $rx->duration,
                    'quantity' => $rx->quantity,
                    'status' => $rx->status,
                    'prescribed_by' => $rx->physician?->name ?? 'N/A',
                    'created_at' => $rx->created_at->format('Y-m-d'),
                ];
            }),
            'labOrders' => $labOrders->map(function ($lab) {
                return [
                    'id' => $lab->id,
                    'test_name' => $lab->test_name,
                    'status' => $lab->status,
                    'priority' => $lab->priority ?? 'routine',
                    'ordered_at' => $lab->created_at->format('Y-m-d H:i'),
                    'result' => $lab->result ?? 'Pending',
                ];
            }),
            'imagingOrders' => $imagingOrders->map(function ($img) {
                return [
                    'id' => $img->id,
                    'imaging_type' => $img->imaging_type,
                    'status' => $img->status,
                    'priority' => $img->priority ?? 'routine',
                    'ordered_at' => $img->created_at->format('Y-m-d H:i'),
                ];
            }),
            'diagnoses' => $diagnoses->map(function ($dx) {
                return [
                    'id' => $dx->id,
                    'diagnosis_code' => $dx->icd10_code ?? $dx->diagnosis_code ?? 'N/A',
                    'diagnosis_description' => $dx->description ?? $dx->diagnosis_description ?? 'N/A',
                    'type' => $dx->type ?? 'PRIMARY',
                    'diagnosed_at' => $dx->diagnosed_at ?
                        (is_string($dx->diagnosed_at) ? $dx->diagnosed_at : $dx->diagnosed_at->format('Y-m-d')) :
                        $dx->created_at->format('Y-m-d'),
                    'source' => isset($dx->appointment_id) ? 'OPD' : 'Inpatient',
                ];
            })->values(),
            'stats' => [
                'total_visits' => $opdAppointments->count() + $regularAppointments->count(),
                'total_admissions' => $encounters->count(),
                'active_prescriptions' => $prescriptions->where('status', 'active')->count(),
                'pending_labs' => $labOrders->where('status', 'pending')->count(),
            ]
        ]);
    }
}
