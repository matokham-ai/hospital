<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Alert;
use App\Models\AppointmentSlot;
use App\Models\Bed;
use App\Models\BedAssignment;
use App\Models\ImagingOrder;
use App\Models\LabOrder;
use App\Models\MedicationAdministration;
use App\Models\OpdAppointment;
use App\Models\Task;
use App\Models\User;
use App\Models\VitalSign;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        // Calculate shift time (assuming 8-hour shifts)
        $shiftStart = $now->copy()->startOfDay()->addHours(7);
        $shiftEnd = $shiftStart->copy()->addHours(8);
        $shiftTotalMinutes = $shiftStart->diffInMinutes($shiftEnd);
        $elapsedMinutes = $now->lt($shiftStart)
            ? 0
            : min($shiftTotalMinutes, $shiftStart->diffInMinutes($now));
        $remainingMinutes = max(0, $shiftTotalMinutes - $elapsedMinutes);
        $elapsed = $this->formatDuration($elapsedMinutes);

        // Get active encounters with comprehensive data
        $activeEncounters = Encounter::with([
            'patient',
            'bedAssignments.bed.ward',
            'vitalSigns' => function($query) {
                $query->latest()->limit(1);
            },
            'medicationAdministrations' => function($query) use ($now) {
                $query->where('status', 'due')
                      ->where('scheduled_time', '<=', $now->copy()->addHours(2));
            },
            'labOrders' => function($query) {
                $query->where('status', 'pending');
            }
        ])
        ->where('status', 'ACTIVE')
        ->whereHas('bedAssignments', function($query) {
            $query->whereNull('released_at');
        })
        ->get();

        // Map patients to enhanced card format
        $patients = $activeEncounters->map(function ($encounter) use ($now) {
            $patient = $encounter->patient;
            $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
            $latestVitals = $encounter->vitalSigns->first();

            // Determine acuity level based on vitals and conditions
            $acuity = $this->calculateAcuity($latestVitals, $encounter);

            // Get next medication
            $nextMed = $encounter->medicationAdministrations
                ->sortBy('scheduled_time')
                ->first();

            return [
                'id' => $patient->id,
                'encounter_id' => $encounter->id,
                'name' => $patient->name,
                'age' => $patient->age ?? Carbon::parse($patient->date_of_birth)->age,
                'sex' => $patient->gender ?? 'U',
                'bed_number' => $bedAssignment ? $bedAssignment->bed->bed_number : 'N/A',
                'ward' => $bedAssignment ? ($bedAssignment->bed->ward->name ?? 'General') : 'N/A',
                'acuity' => $acuity,
                'vitals' => $latestVitals ? [
                    'bp_systolic' => $latestVitals->systolic_bp ?? 0,
                    'bp_diastolic' => $latestVitals->diastolic_bp ?? 0,
                    'heart_rate' => $latestVitals->heart_rate ?? 0,
                    'temperature' => $latestVitals->temperature ?? 0,
                    'spo2' => $latestVitals->oxygen_saturation ?? 0,
                    'respiratory_rate' => $latestVitals->respiratory_rate ?? 0,
                    'recorded_at' => $latestVitals->recorded_at,
                ] : null,
                'badges' => [
                    'labs_pending' => $encounter->labOrders->count(),
                    'meds_due' => $encounter->medicationAdministrations->count(),
                    'alerts' => $this->getAlertCount($latestVitals),
                    'new_orders' => 0, // Orders not in current schema
                ],
                'next_medication' => $nextMed ?
                    Carbon::parse($nextMed->scheduled_time)->format('H:i') :
                    'None due',
            ];
        });

        // Get KPIs
        $kpis = [
            'assignedPatients' => $activeEncounters->count(),
            'medicationsGiven' => MedicationAdministration::whereDate('administered_at', $today)
                ->where('status', 'given')
                ->count(),
            'vitalsRecorded' => VitalSign::whereDate('recorded_at', $today)
                ->count(),
            'pendingTasks' => $this->getPendingTasksCount($user, $now),
        ];

        // Get priority tasks
        $tasks = $this->getPriorityTasks($user, $now, $activeEncounters);

        $patientCollection = collect($patients);
        $acuityCounts = $patientCollection->groupBy('acuity')->map->count();
        $overdueVitals = $patientCollection->filter(function ($patient) use ($now) {
            if (empty($patient['vitals']) || empty($patient['vitals']['recorded_at'])) {
                return true;
            }

            return Carbon::parse($patient['vitals']['recorded_at'])->diffInHours($now) >= 6;
        })->count();

        $activeAlerts = Alert::whereIn('patient_id', $patientCollection->pluck('id'))
            ->where(function ($query) {
                $query->whereNull('resolved_at')->orWhere('status', 'ACTIVE');
            })
            ->count();

        $pendingMedications = MedicationAdministration::where('status', 'due')
            ->whereBetween('scheduled_time', [$now, $now->copy()->addHours(4)])
            ->count();

        $tasksDueToday = Task::where('assigned_to', $user->id)
            ->where('status', '!=', 'completed')
            ->whereDate('due_date', $today)
            ->count();

        $opdAppointments = OpdAppointment::whereDate('appointment_date', $today)
            ->whereNotIn('status', ['CANCELLED', 'COMPLETED'])
            ->count();

        $analytics = $this->buildAnalytics(
            $kpis,
            $acuityCounts,
            $activeEncounters,
            $now
        );

        $admissionsToday = Encounter::where(function ($query) use ($today) {
            $query->whereDate('admission_datetime', $today)
                ->orWhere(function ($inner) use ($today) {
                    $inner->whereNull('admission_datetime')
                        ->whereDate('created_at', $today);
                });
        })->count();

        $dischargesToday = Encounter::whereNotNull('discharge_datetime')
            ->whereDate('discharge_datetime', $today)
            ->count();

        $alertsResolvedToday = Alert::whereNotNull('resolved_at')
            ->whereDate('resolved_at', $today)
            ->count();

        $lastVital = VitalSign::whereDate('recorded_at', $today)
            ->latest('recorded_at')
            ->first();

        $lastVitalAt = $lastVital && $lastVital->recorded_at
            ? Carbon::parse($lastVital->recorded_at)
            : null;

        $dailyActivity = [
            'admissions' => $admissionsToday,
            'discharges' => $dischargesToday,
            'medicationsDueSoon' => $pendingMedications,
            'alertsResolved' => $alertsResolvedToday,
            'lastVitalsAt' => $lastVitalAt?->toIso8601String(),
            'lastVitalsDiff' => $lastVitalAt?->diffForHumans(),
        ];

        $unitOverview = $this->buildUnitOverview($now, $activeEncounters);

        // Add active shift metrics for new dashboard
        $activeShift = [
            'patientsAssigned' => $kpis['assignedPatients'],
            'tasksCompleted' => Task::where('assigned_to', $user->id)
                ->where('status', 'completed')
                ->whereDate('completed_at', $today)
                ->count(),
            'pendingTasks' => $tasksDueToday,
            'alerts' => $activeAlerts,
        ];

        // Update KPIs to include alerts
        $kpis['alerts'] = $activeAlerts;

        // Build live patients data
        $livePatients = $this->buildLivePatients($activeEncounters, $now);

        return Inertia::render('Nurse/Dashboard', [
            'userName' => $user->name ?? 'Nurse',
            'userRole' => $user->getRoleNames()->first() ?? 'Nurse',
            'shift' => [
                'start' => $shiftStart->format('H:i'),
                'end' => $shiftEnd->format('H:i'),
                'elapsed' => $elapsed,
                'remaining' => $this->formatDuration($remainingMinutes),
                'label' => $this->buildShiftLabel($shiftStart, $shiftEnd),
            ],
            'kpis' => $kpis,
            'activeShift' => $activeShift,
            'analytics' => $analytics,
            'unitOverview' => $unitOverview,
            'tasks' => $tasks,
            'dailyActivity' => $dailyActivity,
            'livePatients' => $livePatients,
        ]);
    }

    private function calculateAcuity($vitals, $encounter)
    {
        if (!$vitals) {
            return 'stable';
        }

        // Critical conditions
        if ($vitals->oxygen_saturation < 90 ||
            $vitals->systolic_bp < 90 ||
            $vitals->systolic_bp > 180 ||
            $vitals->heart_rate < 40 ||
            $vitals->heart_rate > 130 ||
            $vitals->temperature > 39.5) {
            return 'critical';
        }

        // High risk conditions
        if ($vitals->oxygen_saturation < 95 ||
            $vitals->systolic_bp < 100 ||
            $vitals->systolic_bp > 160 ||
            $vitals->heart_rate < 50 ||
            $vitals->heart_rate > 110 ||
            $vitals->temperature > 38.5) {
            return 'high-risk';
        }

        // Stable with monitoring
        if ($vitals->oxygen_saturation < 97) {
            return 'stable';
        }

        return 'routine';
    }

    private function getAlertCount($vitals)
    {
        if (!$vitals) {
            return 1; // Alert for missing vitals
        }

        $alerts = 0;

        if ($vitals->oxygen_saturation < 95) $alerts++;
        if ($vitals->systolic_bp < 90 || $vitals->systolic_bp > 160) $alerts++;
        if ($vitals->heart_rate < 50 || $vitals->heart_rate > 110) $alerts++;
        if ($vitals->temperature > 38.5) $alerts++;

        return $alerts;
    }

    private function getPendingTasksCount($user, $now)
    {
        $medsDue = MedicationAdministration::where('status', 'due')
            ->whereBetween('scheduled_time', [$now, $now->copy()->addHours(4)])
            ->count();

        $vitalsDue = VitalSign::whereDate('recorded_at', '<', $now->subHours(8))
            ->count();

        $assignedTasks = Task::where('assigned_to', $user->id)
            ->where('status', '!=', 'completed')
            ->whereDate('due_date', '<=', $now->addDay())
            ->count();

        return $medsDue + $vitalsDue + $assignedTasks;
    }

    private function getPriorityTasks($user, $now, $encounters)
    {
        $tasks = collect();

        // Overdue medications
        $overdueMeds = MedicationAdministration::where('status', 'due')
            ->where('scheduled_time', '<', $now)
            ->count();

        if ($overdueMeds > 0) {
            $tasks->push([
                'id' => 'overdue-meds',
                'title' => 'Overdue Medications',
                'priority' => 'high',
                'due_time' => 'OVERDUE',
                'overdue' => true,
                'count' => $overdueMeds,
                'type' => 'medication',
            ]);
        }

        // Upcoming medications (next 30 min)
        $upcomingMeds = MedicationAdministration::where('status', 'due')
            ->whereBetween('scheduled_time', [$now, $now->copy()->addMinutes(30)])
            ->count();

        if ($upcomingMeds > 0) {
            $tasks->push([
                'id' => 'upcoming-meds',
                'title' => 'Medications Due Soon',
                'priority' => 'high',
                'due_time' => 'Next 30 min',
                'overdue' => false,
                'count' => $upcomingMeds,
                'type' => 'medication',
            ]);
        }

        // Vitals overdue (>8 hours)
        $vitalsOverdue = $encounters->filter(function($encounter) use ($now) {
            $lastVital = $encounter->vitalSigns->first();
            return !$lastVital || Carbon::parse($lastVital->recorded_at)->diffInHours($now) > 8;
        })->count();

        if ($vitalsOverdue > 0) {
            $tasks->push([
                'id' => 'vitals-overdue',
                'title' => 'Vital Signs Overdue',
                'priority' => 'high',
                'due_time' => '>8 hours',
                'overdue' => true,
                'count' => $vitalsOverdue,
                'type' => 'vitals',
            ]);
        }

        // Assigned tasks
        $assignedTasks = Task::where('assigned_to', $user->id)
            ->where('status', '!=', 'completed')
            ->whereDate('due_date', '<=', $now->copy()->addDay())
            ->orderBy('priority', 'desc')
            ->orderBy('due_date')
            ->limit(3)
            ->get()
            ->map(function($task) use ($now) {
                $dueDate = Carbon::parse($task->due_date);
                return [
                    'id' => 'task-' . $task->id,
                    'title' => $task->title,
                    'priority' => $task->priority,
                    'due_time' => $dueDate->format('M j, g:i A'),
                    'overdue' => $dueDate->isPast(),
                    'count' => 1,
                    'type' => 'assigned',
                ];
            });

        $tasks = $tasks->concat($assignedTasks);

        // Sort by priority and overdue status
        return $tasks->sortByDesc(function($task) {
            $priorityScore = ['high' => 3, 'medium' => 2, 'low' => 1];
            return ($task['overdue'] ? 10 : 0) + ($priorityScore[$task['priority']] ?? 0);
        })->values()->all();
    }

    private function formatDuration(int $minutes): string
    {
        if ($minutes <= 0) {
            return '0m';
        }

        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        if ($hours === 0) {
            return sprintf('%dm', $remainingMinutes);
        }

        if ($remainingMinutes === 0) {
            return sprintf('%dh', $hours);
        }

        return sprintf('%dh %dm', $hours, $remainingMinutes);
    }

    private function buildShiftLabel(Carbon $start, Carbon $end): string
    {
        $hour = $start->hour;

        $type = match (true) {
            $hour >= 6 && $hour < 14 => 'Day Shift',
            $hour >= 14 && $hour < 22 => 'Evening Shift',
            default => 'Night Shift',
        };

        return sprintf(
            '%s • %s - %s',
            $type,
            $start->format('g A'),
            $end->format('g A')
        );
    }

    private function buildAnalytics(array $kpis, $acuityCounts, $activeEncounters, Carbon $now): array
    {
        $nurseCount = max(1, User::role('Nurse')->where('status', 'ACTIVE')->count());
        $patientsPerNurse = max(1, round($kpis['assignedPatients'] / $nurseCount));

        $shiftStart = $now->copy()->startOfDay()->addHours(7);
        $shiftEnd = $shiftStart->copy()->addHours(8);
        $totalMinutes = max(1, $shiftStart->diffInMinutes($shiftEnd));
        $elapsedMinutes = $now->lt($shiftStart)
            ? 0
            : min($totalMinutes, $shiftStart->diffInMinutes($now));
        $shiftCompletion = round(($elapsedMinutes / $totalMinutes) * 100);

        $encounterIds = $activeEncounters->pluck('id');

        $pendingLabOrders = LabOrder::whereIn('encounter_id', $encounterIds)
            ->whereIn('status', ['PENDING', 'IN_PROGRESS'])
            ->count();

        $pendingImagingOrders = ImagingOrder::whereIn('encounter_id', $encounterIds)
            ->whereIn('status', ['PENDING', 'IN_PROGRESS'])
            ->count();

        $pendingMedOrders = MedicationAdministration::whereIn('encounter_id', $encounterIds)
            ->where('status', 'due')
            ->count();

        $ipdBedsTotal = Bed::count();
        $ipdBedsOccupied = Bed::where('status', 'occupied')->count();
        $bedOccupancy = [
            'occupied' => $ipdBedsOccupied,
            'total' => $ipdBedsTotal,
            'percentage' => $ipdBedsTotal > 0
                ? round(($ipdBedsOccupied / $ipdBedsTotal) * 100)
                : 0,
        ];

        return [
            'patientsPerNurse' => sprintf('%d:1', $patientsPerNurse),
            'shiftCompletion' => $shiftCompletion,
            'pendingOrders' => [
                'total' => $pendingLabOrders + $pendingImagingOrders + $pendingMedOrders,
                'labs' => $pendingLabOrders,
                'imaging' => $pendingImagingOrders,
                'medications' => $pendingMedOrders,
            ],
            'bedOccupancy' => $bedOccupancy,
            'riskDistribution' => [
                'critical' => $acuityCounts->get('critical', 0),
                'high' => $acuityCounts->get('high-risk', 0),
                'stable' => $acuityCounts->get('stable', 0),
                'routine' => $acuityCounts->get('routine', 0),
            ],
        ];
    }

    private function buildUnitOverview(Carbon $now, $activeEncounters): array
    {
        $ipdBedsTotal = Bed::count();
        $ipdBedsOccupied = Bed::where('status', 'occupied')->count();

        $ipdLatestUpdate = BedAssignment::latest('updated_at')->first()?->updated_at
            ?? Encounter::latest('updated_at')->first()?->updated_at;

        $opdActive = OpdAppointment::whereDate('appointment_date', $now)
            ->whereNotIn('status', ['CANCELLED', 'COMPLETED'])
            ->count();

        $opdCapacity = AppointmentSlot::whereDate('slot_date', $now)
            ->sum('max_appointments');

        $opdCapacity = $opdCapacity > 0 ? $opdCapacity : max(24, $opdActive + 6);

        $opdLatestUpdate = OpdAppointment::latest('updated_at')->first()?->updated_at;

        return [
            [
                'id' => 'ipd',
                'name' => 'Inpatient Department',
                'type' => 'IPD',
                'patients' => $activeEncounters->count(),
                'updatedAt' => $ipdLatestUpdate?->toIso8601String(),
                'updatedAgo' => $ipdLatestUpdate?->diffForHumans() ?? 'No recent updates',
                'occupancy' => [
                    'occupied' => $ipdBedsOccupied,
                    'capacity' => $ipdBedsTotal,
                    'percentage' => $ipdBedsTotal > 0
                        ? round(($ipdBedsOccupied / $ipdBedsTotal) * 100)
                        : 0,
                ],
            ],
            [
                'id' => 'opd',
                'name' => 'Outpatient Department',
                'type' => 'OPD',
                'patients' => $opdActive,
                'updatedAt' => $opdLatestUpdate?->toIso8601String(),
                'updatedAgo' => $opdLatestUpdate?->diffForHumans() ?? 'No recent updates',
                'occupancy' => [
                    'occupied' => $opdActive,
                    'capacity' => $opdCapacity,
                    'percentage' => $opdCapacity > 0
                        ? round(($opdActive / $opdCapacity) * 100)
                        : 0,
                ],
            ],
        ];
    }

    private function buildLivePatients($activeEncounters, Carbon $now): array
    {
        return $activeEncounters->map(function ($encounter) use ($now) {
            $patient = $encounter->patient;
            $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
            $latestVitals = $encounter->vitalSigns->first();

            // Determine patient status based on vitals
            $status = $this->determinePatientStatus($latestVitals);

            // Get pending actions
            $pendingMeds = $encounter->medicationAdministrations
                ->where('status', 'due')
                ->count();

            $pendingLabs = $encounter->labOrders
                ->where('status', 'pending')
                ->count();

            // Get department from bed assignment or default
            $department = 'General Ward';
            if ($bedAssignment && $bedAssignment->bed && $bedAssignment->bed->ward) {
                $department = $bedAssignment->bed->ward->name;
            }

            // Determine type (IPD/OPD) - if has bed assignment, it's IPD
            $type = $bedAssignment ? 'IPD' : 'OPD';

            return [
                'id' => $patient->id,
                'encounterId' => $encounter->id,
                'mrn' => $patient->mrn ?? sprintf('MRN-%05d', $patient->id),
                'name' => $patient->name,
                'age' => $patient->age ?? Carbon::parse($patient->date_of_birth)->age,
                'gender' => $patient->gender ?? 'Unknown',
                'status' => $status,
                'department' => $department,
                'bed' => $bedAssignment ? $bedAssignment->bed->bed_number : 'OPD',
                'admittedAt' => $encounter->admission_datetime
                    ? Carbon::parse($encounter->admission_datetime)->diffForHumans()
                    : 'Today',
                'diagnosis' => $encounter->chief_complaint ?? 'Under evaluation',
                'lastVitals' => [
                    'bp' => $latestVitals
                        ? sprintf('%d/%d', $latestVitals->systolic_bp ?? 0, $latestVitals->diastolic_bp ?? 0)
                        : 'N/A',
                    'hr' => $latestVitals ? ($latestVitals->heart_rate ?? 0) : 0,
                    'temp' => $latestVitals ? ($latestVitals->temperature ?? 0) : 0,
                    'spo2' => $latestVitals ? ($latestVitals->oxygen_saturation ?? 0) : 0,
                    'time' => $latestVitals && $latestVitals->recorded_at
                        ? Carbon::parse($latestVitals->recorded_at)->format('H:i')
                        : 'N/A',
                ],
                'pendingActions' => [
                    'medications' => $pendingMeds,
                    'labs' => $pendingLabs,
                    'procedures' => 0, // Can be extended later
                ],
                'type' => $type,
            ];
        })->values()->all();
    }

    private function determinePatientStatus($vitals): string
    {
        if (!$vitals) {
            return 'Observation';
        }

        // Critical conditions
        if (($vitals->oxygen_saturation && $vitals->oxygen_saturation < 90) ||
            ($vitals->systolic_bp && ($vitals->systolic_bp < 90 || $vitals->systolic_bp > 180)) ||
            ($vitals->heart_rate && ($vitals->heart_rate < 40 || $vitals->heart_rate > 130)) ||
            ($vitals->temperature && $vitals->temperature > 39.5)) {
            return 'Critical';
        }

        // Moderate conditions
        if (($vitals->oxygen_saturation && $vitals->oxygen_saturation < 95) ||
            ($vitals->systolic_bp && ($vitals->systolic_bp < 100 || $vitals->systolic_bp > 160)) ||
            ($vitals->heart_rate && ($vitals->heart_rate < 50 || $vitals->heart_rate > 110)) ||
            ($vitals->temperature && $vitals->temperature > 38.5)) {
            return 'Moderate';
        }

        return 'Stable';
    }
}
