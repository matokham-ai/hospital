<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use Carbon\Carbon;

class OPDController extends Controller
{
    public function appointments(Request $request)
    {
        $today = Carbon::today();

        // Get today's appointments
        $appointments = Appointment::with(['patient', 'doctor'])
            ->whereDate('appointment_date', $today)
            ->get()
            ->map(function($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient->name ?? 'Unknown',
                    'patient_id' => $apt->patient->id ?? 'N/A',
                    'age' => $apt->patient->age ?? 0,
                    'gender' => $apt->patient->gender ?? 'U',
                    'phone' => $apt->patient->phone ?? 'N/A',
                    'appointment_time' => Carbon::parse($apt->appointment_date)->format('H:i'),
                    'doctor_name' => $apt->doctor->name ?? 'TBA',
                    'department' => $apt->department ?? 'General',
                    'status' => $apt->status ?? 'scheduled',
                    'visit_type' => $apt->visit_type ?? 'follow-up',
                    'chief_complaint' => $apt->reason ?? null,
                    'room' => $apt->room ?? null,
                ];
            });

        // Calculate stats
        $stats = [
            'total' => $appointments->count(),
            'scheduled' => $appointments->where('status', 'scheduled')->count(),
            'checkedIn' => $appointments->where('status', 'checked-in')->count(),
            'inProgress' => $appointments->where('status', 'in-progress')->count(),
            'completed' => $appointments->where('status', 'completed')->count(),
        ];

        return Inertia::render('Nurse/OPD/Appointments', [
            'appointments' => $appointments->values(),
            'stats' => $stats,
            'filters' => [
                'date' => $today->format('Y-m-d'),
                'status' => $request->get('status', 'all'),
                'search' => $request->get('search', ''),
            ],
        ]);
    }

    public function checkIn(Request $request, $appointmentId)
    {
        $appointment = Appointment::findOrFail($appointmentId);
        $appointment->update(['status' => 'checked-in']);

        return redirect()->back()->with('success', 'Patient checked in successfully');
    }

    public function triageQueue(Request $request)
    {
        // Get patients waiting for triage
        $patients = Appointment::with('patient')
            ->whereDate('appointment_date', Carbon::today())
            ->where('status', 'checked-in')
            ->get()
            ->map(function($apt) {
                $arrivalTime = Carbon::parse($apt->updated_at);
                $waitMinutes = $arrivalTime->diffInMinutes(now());

                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient->name ?? 'Unknown',
                    'patient_id' => $apt->patient->id ?? 'N/A',
                    'age' => $apt->patient->age ?? 0,
                    'gender' => $apt->patient->gender ?? 'U',
                    'arrival_time' => $arrivalTime->format('H:i'),
                    'wait_time' => $waitMinutes . ' min',
                    'chief_complaint' => $apt->reason ?? 'Not specified',
                    'priority' => $this->calculatePriority($apt, $waitMinutes),
                    'vitals_taken' => false, // TODO: Check if vitals exist
                    'last_vitals' => null,
                ];
            });

        // Calculate stats
        $stats = [
            'total' => $patients->count(),
            'emergency' => $patients->where('priority', 'emergency')->count(),
            'urgent' => $patients->where('priority', 'urgent')->count(),
            'semiUrgent' => $patients->where('priority', 'semi-urgent')->count(),
            'nonUrgent' => $patients->where('priority', 'non-urgent')->count(),
            'avgWaitTime' => $patients->count() > 0 ?
                round($patients->avg(fn($p) => (int)str_replace(' min', '', $p['wait_time']))) . ' min' :
                '0 min',
        ];

        return Inertia::render('Nurse/OPD/TriageQueue', [
            'patients' => $patients->values(),
            'stats' => $stats,
        ]);
    }

    public function walkIns(Request $request)
    {
        $today = Carbon::today();

        // Get walk-in patients for today
        $patients = Appointment::with('patient')
            ->whereDate('appointment_date', $today)
            ->where('appointment_type', 'walk-in')
            ->get()
            ->map(function($apt, $index) {
                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient->name ?? 'Unknown',
                    'patient_id' => $apt->patient->id ?? 'N/A',
                    'age' => $apt->patient->age ?? 0,
                    'gender' => $apt->patient->gender ?? 'U',
                    'phone' => $apt->patient->phone ?? 'N/A',
                    'arrival_time' => Carbon::parse($apt->created_at)->format('H:i'),
                    'chief_complaint' => $apt->reason ?? 'Not specified',
                    'status' => $apt->status ?? 'waiting',
                    'queue_number' => $index + 1,
                    'is_new_patient' => $apt->visit_type === 'new',
                ];
            });

        $stats = [
            'total' => $patients->count(),
            'waiting' => $patients->where('status', 'waiting')->count(),
            'inTriage' => $patients->where('status', 'in-triage')->count(),
            'withDoctor' => $patients->where('status', 'with-doctor')->count(),
            'completed' => $patients->where('status', 'completed')->count(),
        ];

        return Inertia::render('Nurse/OPD/WalkIns', [
            'patients' => $patients->values(),
            'stats' => $stats,
            'nextQueueNumber' => $patients->count() + 1,
        ]);
    }

    public function registerWalkIn(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'age' => 'required|integer',
            'gender' => 'required|in:M,F,O',
            'phone' => 'required|string',
            'chief_complaint' => 'required|string',
            'is_new_patient' => 'boolean',
        ]);

        // Create or get patient
        if ($validated['patient_id']) {
            $patient = Patient::find($validated['patient_id']);
        } else {
            $patient = Patient::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'date_of_birth' => Carbon::now()->subYears($validated['age']),
                'gender' => $validated['gender'],
                'phone' => $validated['phone'],
            ]);
        }

        // Create walk-in appointment
        Appointment::create([
            'patient_id' => $patient->id,
            'appointment_date' => Carbon::now(),
            'appointment_type' => 'walk-in',
            'visit_type' => $validated['is_new_patient'] ? 'new' : 'follow-up',
            'reason' => $validated['chief_complaint'],
            'status' => 'waiting',
        ]);

        return redirect()->back()->with('success', 'Walk-in patient registered successfully');
    }

    public function consultations()
    {
        return Inertia::render('Nurse/OPD/Consultations');
    }

    public function procedures()
    {
        return Inertia::render('Nurse/OPD/Procedures');
    }

    public function prescriptions()
    {
        return Inertia::render('Nurse/OPD/Prescriptions');
    }

    public function diagnostics()
    {
        return Inertia::render('Nurse/OPD/Orders');
    }

    private function calculatePriority($appointment, $waitMinutes)
    {
        // Simple priority calculation based on wait time and reason
        // TODO: Implement proper triage algorithm

        if ($waitMinutes > 60) {
            return 'urgent';
        }

        if ($waitMinutes > 30) {
            return 'semi-urgent';
        }

        return 'non-urgent';
    }
}
