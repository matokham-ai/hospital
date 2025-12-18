<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Patient;
use App\Models\CarePlan;
use App\Models\Assessment;
use App\Models\NursingNote;
use Carbon\Carbon;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $routeName = $request->route() ? $request->route()->getName() : null;

        $scope = match ($routeName) {
            'nurse.patients.my', 'nurse.patients' => 'assigned',
            'nurse.patients.clinic' => 'clinic',
            'nurse.patients.ward' => 'ward',
            'nurse.patients.all' => 'all',
            default => 'assigned',
        };

        $query = Patient::with([
            'encounters' => function($q) {
                $q->where('status', 'ACTIVE')
                  ->with(['bedAssignments.bed.ward', 'vitalSigns' => function($vq) {
                      $vq->latest()->limit(1);
                  }]);
            }
        ])->whereHas('encounters', function($q) {
            $q->where('status', 'ACTIVE');
        });

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%")
                  ->orWhere('hospital_id', 'like', "%{$search}%");
            });
        }

        $patientsCollection = $query->get()->map(function($patient) {
            $encounter = $patient->encounters->first();
            $bedAssignment = $encounter ? $encounter->bedAssignments->where('released_at', null)->first() : null;
            $latestVitals = $encounter ? $encounter->vitalSigns->first() : null;

            $type = $bedAssignment ? 'IPD' : 'OPD';

            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'age' => $patient->age,
                'gender' => $patient->gender,
                'bed' => $bedAssignment ? $bedAssignment->bed->bed_number : 'N/A',
                'ward' => $bedAssignment ? ($bedAssignment->bed->ward->name ?? 'General') : 'Clinic',
                'encounter_id' => $encounter ? $encounter->id : null,
                'last_vitals' => $latestVitals && $latestVitals->recorded_at
                    ? Carbon::parse($latestVitals->recorded_at)->toIso8601String()
                    : null,
                'type' => $type,
                'admitted_at' => $encounter && $encounter->admission_datetime
                    ? Carbon::parse($encounter->admission_datetime)->toDateTimeString()
                    : null,
            ];
        });

        $counts = [
            'all' => $patientsCollection->count(),
            'clinic' => $patientsCollection->where('type', 'OPD')->count(),
            'ward' => $patientsCollection->where('type', 'IPD')->count(),
        ];
        $counts['assigned'] = $counts['all'];

        $patients = match ($scope) {
            'clinic' => $patientsCollection->where('type', 'OPD')->values(),
            'ward' => $patientsCollection->where('type', 'IPD')->values(),
            default => $patientsCollection->values(),
        };

        $meta = match ($scope) {
            'clinic' => [
                'title' => 'My Clinic Patients',
                'subtitle' => 'OPD patients currently assigned to your care.',
            ],
            'ward' => [
                'title' => 'My Ward Patients',
                'subtitle' => 'Inpatients with active bed assignments under your watch.',
            ],
            'all' => [
                'title' => 'All Active Patients',
                'subtitle' => 'Complete list of currently admitted patients across units.',
            ],
            default => [
                'title' => 'My Assigned Patients',
                'subtitle' => 'Patients assigned to you for the current shift.',
            ],
        };

        return Inertia::render('Nurse/Patients/Index', [
            'patients' => $patients,
            'filters' => [
                'search' => $search,
                'scope' => $scope,
                'counts' => $counts,
            ],
            'meta' => $meta,
            'currentRoute' => $routeName,
        ]);
    }

    public function show(Patient $patient)
    {
        $patient->load([
            'encounters' => function($query) {
                $query->where('status', 'ACTIVE')->with(['bedAssignments.bed.ward', 'vitalSigns', 'medicationAdministrations']);
            },
            'patientAlerts' => function($query) {
                $query->where('status', 'active');
            }
        ]);

        $nursingNotes = NursingNote::where('patient_id', $patient->id)
            ->latest('note_datetime')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($note) {
                return [
                    'id' => $note->id,
                    'note_type' => $note->note_type,
                    'content' => $note->content,
                    'note_datetime' => optional($note->note_datetime)->toIso8601String(),
                    'author' => $note->author?->name,
                ];
            });

        return Inertia::render('Nurse/Patients/Show', [
            'patient' => $patient,
            'activeEncounter' => $patient->encounters->first(),
            'alerts' => $patient->patientAlerts,
            'nursingNotes' => $nursingNotes,
        ]);
    }

    public function carePlans(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = 5;

        $query = CarePlan::with(['patient', 'encounter'])
            ->whereDate('plan_date', today());

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('patient', function($patientQuery) use ($search) {
                    $patientQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('id', 'like', "%{$search}%");
                })
                ->orWhere('priority', 'like', "%{$search}%")
                ->orWhere('goals', 'like', "%{$search}%")
                ->orWhere('interventions', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $carePlans = $query->orderBy('priority', 'desc')->paginate($perPage);

        return Inertia::render('Nurse/CarePlans/Index', [
            'carePlans' => $carePlans->getCollection()->map(function($plan) {
                return [
                    'id' => $plan->id,
                    'patient_name' => $plan->patient->name,
                    'patient_id' => $plan->patient_id,
                    'plan_date' => $plan->plan_date,
                    'priority' => $plan->priority,
                    'goals' => $plan->goals,
                    'interventions' => $plan->interventions,
                    'status' => $plan->status
                ];
            }),
            'pagination' => [
                'current_page' => $carePlans->currentPage(),
                'total' => $carePlans->total(),
                'per_page' => $carePlans->perPage(),
                'last_page' => $carePlans->lastPage(),
                'from' => $carePlans->firstItem(),
                'to' => $carePlans->lastItem(),
            ],
            'filters' => [
                'search' => $search
            ]
        ]);
    }

    public function assessments(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = 5;

        $query = Assessment::with(['patient', 'encounter'])
            ->whereDate('assessment_date', today());

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('patient', function($patientQuery) use ($search) {
                    $patientQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('id', 'like', "%{$search}%");
                })
                ->orWhere('type', 'like', "%{$search}%")
                ->orWhere('findings', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $assessments = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return Inertia::render('Nurse/Assessments/Index', [
            'assessments' => $assessments->getCollection()->map(function($assessment) {
                return [
                    'id' => $assessment->id,
                    'patient_name' => $assessment->patient->name,
                    'patient_id' => $assessment->patient_id,
                    'assessment_date' => $assessment->assessment_date,
                    'type' => $assessment->type,
                    'findings' => $assessment->findings,
                    'status' => $assessment->status
                ];
            }),
            'pagination' => [
                'current_page' => $assessments->currentPage(),
                'total' => $assessments->total(),
                'per_page' => $assessments->perPage(),
                'last_page' => $assessments->lastPage(),
                'from' => $assessments->firstItem(),
                'to' => $assessments->lastItem(),
            ],
            'filters' => [
                'search' => $search
            ]
        ]);
    }
}
