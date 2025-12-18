<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Encounter;
use App\Models\VitalSign;
use Carbon\Carbon;

class VitalsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = 5;

        $query = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->where('status', 'ACTIVE')
            ->whereHas('bedAssignments', function($query) {
                $query->whereNull('released_at');
            });

        // Apply search filter
        if ($search) {
            $query->whereHas('patient', function($patientQuery) use ($search) {
                $patientQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $activeEncounters = $query->get();

        $patientsNeedingVitals = $activeEncounters->filter(function($encounter) {
            $lastVital = $encounter->vitalSigns()->latest()->first();
            return !$lastVital || Carbon::parse($lastVital->recorded_at)->diffInHours(now()) > 8;
        });

        // Apply pagination to the filtered collection
        $currentPage = $request->get('page', 1);
        $offset = ($currentPage - 1) * $perPage;
        $paginatedPatients = $patientsNeedingVitals->slice($offset, $perPage);
        $total = $patientsNeedingVitals->count();

        return Inertia::render('Nurse/Vitals/Index', [
            'patients' => $paginatedPatients->map(function($encounter) {
                $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
                return [
                    'encounter_id' => $encounter->id,
                    'patient_id' => $encounter->patient->id,
                    'name' => $encounter->patient->name,
                    'room' => $bedAssignment ? 
                        ($bedAssignment->bed->ward->name ?? 'Ward') . ' - Bed ' . $bedAssignment->bed->bed_number : 
                        'No bed assigned',
                    'last_vitals' => $encounter->vitalSigns()->latest()->first()?->recorded_at,
                ];
            })->values(),
            'pagination' => [
                'current_page' => $currentPage,
                'total' => $total,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
                'from' => $offset + 1,
                'to' => min($offset + $perPage, $total),
            ],
            'filters' => [
                'search' => $search
            ]
        ]);
    }

    public function show(Encounter $encounter)
    {
        $encounter->load(['patient', 'vitalSigns' => function($query) {
            $query->latest()->limit(10);
        }]);

        return Inertia::render('Nurse/Vitals/Show', [
            'encounter' => $encounter,
            'patient' => [
                'id' => $encounter->patient->id,
                'name' => $encounter->patient->name,
                'date_of_birth' => $encounter->patient->date_of_birth,
                'gender' => $encounter->patient->gender,
                'allergies' => $encounter->patient->allergies,
                'chronic_conditions' => $encounter->patient->chronic_conditions
            ],
            'recentVitals' => $encounter->vitalSigns
        ]);
    }

    public function store(Request $request, Encounter $encounter)
    {
        $validated = $request->validate([
            'temperature' => 'required|numeric|min:30|max:45',
            'heart_rate' => 'required|integer|min:30|max:200',
            'blood_pressure_systolic' => 'required|integer|min:70|max:250',
            'blood_pressure_diastolic' => 'required|integer|min:40|max:150',
            'respiratory_rate' => 'required|integer|min:8|max:40',
            'oxygen_saturation' => 'required|integer|min:70|max:100',
            'notes' => 'nullable|string|max:500'
        ]);

        VitalSign::create([
            'encounter_id' => $encounter->id,
            'temperature' => $validated['temperature'],
            'heart_rate' => $validated['heart_rate'],
            'systolic_bp' => $validated['blood_pressure_systolic'],
            'diastolic_bp' => $validated['blood_pressure_diastolic'],
            'respiratory_rate' => $validated['respiratory_rate'],
            'oxygen_saturation' => $validated['oxygen_saturation'],
            'notes' => $validated['notes'],
            'recorded_at' => now(),
            'recorded_by' => auth()->id()
        ]);

        return redirect()->route('nurse.vitals')->with('success', 'Vital signs recorded successfully.');
    }
}