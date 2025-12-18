<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\BedAssignment;
use App\Models\Encounter;
use Carbon\Carbon;

class WardController extends Controller
{
    public function census(Request $request)
    {
        $today = Carbon::today();
        
        // Get all wards with bed information
        $wards = Ward::with(['beds.bedAssignments' => function($query) {
            $query->whereNull('released_at')
                  ->with(['encounter.patient']);
        }])->get()->map(function($ward) {
            $totalBeds = $ward->beds->count();
            $occupiedBeds = $ward->beds->filter(function($bed) {
                return $bed->bedAssignments->where('released_at', null)->count() > 0;
            })->count();
            
            $patients = $ward->beds->flatMap(function($bed) {
                return $bed->bedAssignments->where('released_at', null)->map(function($assignment) use ($bed) {
                    $patient = $assignment->encounter->patient;
                    $admissionDate = Carbon::parse($assignment->assigned_at);
                    
                    return [
                        'id' => $patient->id,
                        'name' => $patient->name,
                        'age' => $patient->age ?? 0,
                        'gender' => $patient->gender ?? 'U',
                        'bed_number' => $bed->bed_number,
                        'admission_date' => $admissionDate->format('Y-m-d'),
                        'los' => $admissionDate->diffInDays(now()),
                        'diagnosis' => $assignment->encounter->diagnosis ?? 'Not specified',
                        'acuity' => $this->calculateAcuity($assignment->encounter),
                        'alerts' => 0, // TODO: Get actual alerts
                        'pending_tasks' => 0, // TODO: Get actual tasks
                    ];
                });
            })->values();
            
            return [
                'id' => $ward->wardid,
                'name' => $ward->name,
                'total_beds' => $totalBeds,
                'occupied_beds' => $occupiedBeds,
                'available_beds' => $totalBeds - $occupiedBeds,
                'occupancy_rate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100) : 0,
                'patients' => $patients,
            ];
        });

        // Calculate summary statistics
        $totalBeds = $wards->sum('total_beds');
        $occupiedBeds = $wards->sum('occupied_beds');
        
        $summary = [
            'total_beds' => $totalBeds,
            'occupied_beds' => $occupiedBeds,
            'available_beds' => $totalBeds - $occupiedBeds,
            'overall_occupancy' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100) : 0,
            'admissions_today' => Encounter::whereDate('admission_datetime', $today)->count(),
            'discharges_today' => Encounter::whereDate('discharge_datetime', $today)->count(),
            'transfers_today' => BedAssignment::whereDate('assigned_at', $today)
                ->whereNotNull('released_at')
                ->count(),
        ];

        return Inertia::render('Nurse/IPD/WardCensus', [
            'wards' => $wards->values(),
            'summary' => $summary,
        ]);
    }

    public function bedAllocation(Request $request)
    {
        // Get all beds with their current status
        $beds = Bed::with(['ward', 'bedAssignments' => function($query) {
            $query->whereNull('released_at')->with('encounter.patient');
        }])->get()->map(function($bed) {
            $assignment = $bed->bedAssignments->where('released_at', null)->first();
            
            return [
                'id' => $bed->id,
                'bed_number' => $bed->bed_number,
                'ward_id' => $bed->ward_id,
                'ward_name' => $bed->ward->name ?? 'Unknown',
                'status' => $assignment ? 'occupied' : ($bed->status ?? 'available'),
                'patient' => $assignment ? [
                    'id' => $assignment->encounter->patient->id,
                    'name' => $assignment->encounter->patient->name,
                    'age' => $assignment->encounter->patient->age ?? 0,
                    'gender' => $assignment->encounter->patient->gender ?? 'U',
                    'admission_date' => Carbon::parse($assignment->assigned_at)->format('Y-m-d'),
                    'diagnosis' => $assignment->encounter->diagnosis ?? 'Not specified',
                    'acuity' => $this->calculateAcuity($assignment->encounter),
                ] : null,
            ];
        });

        // Get pending admissions (encounters without bed assignments)
        $pendingAdmissions = Encounter::with('patient')
            ->where('status', 'ACTIVE')
            ->whereDoesntHave('bedAssignments', function($query) {
                $query->whereNull('released_at');
            })
            ->get()
            ->map(function($encounter) {
                return [
                    'id' => $encounter->id,
                    'patient_name' => $encounter->patient->name,
                    'patient_id' => $encounter->patient->id,
                    'age' => $encounter->patient->age ?? 0,
                    'gender' => $encounter->patient->gender ?? 'U',
                    'admission_type' => $encounter->type ?? 'EMERGENCY',
                    'diagnosis' => $encounter->chief_complaint ?? 'Pending',
                    'priority' => $this->calculateAdmissionPriority($encounter),
                    'waiting_since' => Carbon::parse($encounter->admission_datetime)->diffForHumans(),
                ];
            });

        $stats = [
            'total_beds' => $beds->count(),
            'available' => $beds->where('status', 'available')->count(),
            'occupied' => $beds->where('status', 'occupied')->count(),
            'reserved' => $beds->where('status', 'reserved')->count(),
            'maintenance' => $beds->where('status', 'maintenance')->count(),
            'pending_admissions' => $pendingAdmissions->count(),
        ];

        $wards = Ward::select('wardid', 'name')->get();

        return Inertia::render('Nurse/IPD/BedAllocation', [
            'beds' => $beds->values(),
            'pendingAdmissions' => $pendingAdmissions->values(),
            'wards' => $wards,
            'stats' => $stats,
        ]);
    }

    public function assignBed(Request $request)
    {
        $validated = $request->validate([
            'bed_id' => 'required|exists:beds,id',
            'patient_id' => 'required|exists:patients,id',
            'encounter_id' => 'required|exists:encounters,id',
        ]);

        BedAssignment::create([
            'bed_id' => $validated['bed_id'],
            'encounter_id' => $validated['encounter_id'],
            'assigned_at' => Carbon::now(),
        ]);

        return redirect()->back()->with('success', 'Bed assigned successfully');
    }

    public function releaseBed(Request $request, $bedId)
    {
        $assignment = BedAssignment::where('bed_id', $bedId)
            ->whereNull('released_at')
            ->first();

        if ($assignment) {
            $assignment->update(['released_at' => Carbon::now()]);
        }

        return redirect()->back()->with('success', 'Bed released successfully');
    }

    private function calculateAdmissionPriority($encounter)
    {
        // Simple priority calculation
        if ($encounter->type === 'EMERGENCY') {
            return 'emergency';
        }
        
        $admissionTime = Carbon::parse($encounter->admission_datetime);
        if ($admissionTime->diffInHours(now()) > 2) {
            return 'urgent';
        }
        
        return 'routine';
    }

    public function admissions(Request $request)
    {
        $today = Carbon::today();
        
        // Get today's admissions
        $admissions = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->whereDate('admission_datetime', $today)
            ->where('status', 'ACTIVE')
            ->get()
            ->map(function($encounter) {
                $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
                
                return [
                    'id' => $encounter->id,
                    'patient_name' => $encounter->patient->name,
                    'patient_id' => $encounter->patient->id,
                    'age' => $encounter->patient->age ?? 0,
                    'gender' => $encounter->patient->gender ?? 'U',
                    'admission_time' => Carbon::parse($encounter->admission_datetime)->format('H:i'),
                    'admission_type' => $encounter->type ?? 'EMERGENCY',
                    'diagnosis' => $encounter->chief_complaint ?? 'Pending',
                    'ward' => $bedAssignment ? ($bedAssignment->bed->ward->name ?? 'N/A') : 'Not assigned',
                    'bed' => $bedAssignment ? $bedAssignment->bed->bed_number : 'Not assigned',
                    'status' => $encounter->status,
                ];
            });

        return Inertia::render('Nurse/IPD/Admissions', [
            'admissions' => $admissions->values(),
            'stats' => [
                'total' => $admissions->count(),
                'pending_bed' => $admissions->where('bed', 'Not assigned')->count(),
                'completed' => $admissions->where('bed', '!=', 'Not assigned')->count(),
            ],
        ]);
    }

    public function transfers(Request $request)
    {
        // TODO: Implement patient transfers
        return Inertia::render('Nurse/IPD/Transfers', [
            'transfers' => [],
            'stats' => [
                'pending' => 0,
                'completed' => 0,
            ],
        ]);
    }

    public function discharges(Request $request)
    {
        $today = Carbon::today();
        
        // Get planned discharges for today (encounters with discharge_datetime set for today)
        $discharges = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->whereDate('discharge_datetime', $today)
            ->where('status', 'ACTIVE')
            ->get()
            ->map(function($encounter) {
                $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
                
                return [
                    'id' => $encounter->id,
                    'patient_name' => $encounter->patient->name,
                    'patient_id' => $encounter->patient->id,
                    'age' => $encounter->patient->age ?? 0,
                    'gender' => $encounter->patient->gender ?? 'U',
                    'admission_date' => Carbon::parse($encounter->admission_datetime)->format('Y-m-d'),
                    'los' => Carbon::parse($encounter->admission_datetime)->diffInDays(now()),
                    'diagnosis' => $encounter->chief_complaint ?? 'Not specified',
                    'ward' => $bedAssignment ? ($bedAssignment->bed->ward->name ?? 'N/A') : 'N/A',
                    'bed' => $bedAssignment ? $bedAssignment->bed->bed_number : 'N/A',
                    'discharge_status' => 'pending',
                    'discharge_instructions_ready' => !empty($encounter->discharge_summary),
                ];
            });

        return Inertia::render('Nurse/IPD/Discharges', [
            'discharges' => $discharges->values(),
            'stats' => [
                'planned' => $discharges->count(),
                'completed' => 0,
                'pending_instructions' => $discharges->where('discharge_instructions_ready', false)->count(),
            ],
        ]);
    }

    public function showUnit($unitId)
    {
        // Get ward/unit details with real-time data
        $ward = Ward::with(['beds.bedAssignments' => function($query) {
            $query->whereNull('released_at')
                  ->with(['encounter.patient']);
        }])->findOrFail($unitId);

        $totalBeds = $ward->beds->count();
        $occupiedBeds = $ward->beds->filter(function($bed) {
            return $bed->bedAssignments->where('released_at', null)->count() > 0;
        })->count();
        
        $patients = $ward->beds->flatMap(function($bed) {
            return $bed->bedAssignments->where('released_at', null)->map(function($assignment) use ($bed) {
                $patient = $assignment->encounter->patient;
                $admissionDate = Carbon::parse($assignment->assigned_at);
                
                return [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'age' => $patient->age ?? 0,
                    'gender' => $patient->gender ?? 'U',
                    'bed_number' => $bed->bed_number,
                    'admission_date' => $admissionDate->format('Y-m-d'),
                    'los' => $admissionDate->diffInDays(now()),
                    'diagnosis' => $assignment->encounter->diagnosis ?? 'Not specified',
                    'acuity' => $this->calculateAcuity($assignment->encounter),
                ];
            });
        })->values();

        return Inertia::render('Nurse/Units/Show', [
            'unit' => [
                'id' => $ward->wardid,
                'name' => $ward->name,
                'type' => 'Ward',
                'total_beds' => $totalBeds,
                'occupied_beds' => $occupiedBeds,
                'available_beds' => $totalBeds - $occupiedBeds,
                'occupancy_rate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100) : 0,
                'patients' => $patients,
            ]
        ]);
    }

    private function calculateAcuity($encounter)
    {
        // Simple acuity calculation
        // TODO: Implement proper acuity scoring based on vitals and conditions
        
        $latestVitals = $encounter->vitalSigns()->latest()->first();
        
        if (!$latestVitals) {
            return 'stable';
        }
        
        // Critical conditions
        if ($latestVitals->oxygen_saturation < 90 || 
            $latestVitals->systolic_bp < 90 || 
            $latestVitals->systolic_bp > 180) {
            return 'critical';
        }
        
        // High risk
        if ($latestVitals->oxygen_saturation < 95 || 
            $latestVitals->systolic_bp < 100 || 
            $latestVitals->systolic_bp > 160) {
            return 'high-risk';
        }
        
        return 'stable';
    }
}
