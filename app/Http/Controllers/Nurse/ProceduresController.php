<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use App\Models\NursingProcedure;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class ProceduresController extends Controller
{
    public function index(Request $request)
    {
        $statusFilter = $request->get('status', 'pending');
        $priorityFilter = $request->get('priority');
        $locationFilter = $request->get('location');

        $proceduresQuery = NursingProcedure::with([
            'patient',
            'encounter.bedAssignments.bed.ward',
            'orderedBy',
            'assignedTo',
        ])->latest('scheduled_at');

        if ($statusFilter !== 'all') {
            if ($statusFilter === 'pending') {
                $proceduresQuery->whereIn('status', ['pending', 'overdue']);
            } else {
                $proceduresQuery->where('status', $statusFilter);
            }
        }

        if ($priorityFilter) {
            $proceduresQuery->where('priority', $priorityFilter);
        }

        if ($locationFilter) {
            $proceduresQuery->where('location', $locationFilter);
        }

        $procedures = $proceduresQuery->get()->map(function (NursingProcedure $procedure) {
            $encounter = $procedure->encounter;
            $bedAssignment = $encounter?->bedAssignments?->where('released_at', null)->first();
            $ward = $bedAssignment?->bed?->ward?->name;
            $location = $procedure->location ?? ($ward ? "{$ward} - Bed {$bedAssignment->bed->bed_number}" : null);

            $displayStatus = $procedure->status;
            if (in_array($procedure->status, ['pending', 'in_progress']) && $procedure->is_overdue) {
                $displayStatus = 'overdue';
            }

            return [
                'id' => $procedure->id,
                'patient_id' => $procedure->patient_id,
                'patient_name' => $procedure->patient?->name ?? 'Unknown',
                'mrn' => $procedure->patient_id,
                'location' => $location ?? 'Unassigned',
                'procedure_type' => $procedure->procedure_type,
                'description' => $procedure->description,
                'scheduled_at' => optional($procedure->scheduled_at)->toIso8601String(),
                'priority' => $procedure->priority,
                'status' => $displayStatus,
                'ordered_by' => $procedure->orderedBy?->name ?? 'System',
                'assigned_to' => $procedure->assignedTo?->name,
                'is_overdue' => $procedure->is_overdue,
            ];
        });

        $now = Carbon::now();

        $statistics = [
            'pending' => NursingProcedure::whereIn('status', ['pending', 'overdue'])->count(),
            'in_progress' => NursingProcedure::where('status', 'in_progress')->count(),
            'completed_today' => NursingProcedure::where('status', 'completed')
                ->whereDate('completed_at', today())
                ->count(),
            'overdue' => NursingProcedure::where(function ($query) use ($now) {
                $query->where('status', 'overdue')
                    ->orWhere(function ($pendingQuery) use ($now) {
                        $pendingQuery->where('status', 'pending')
                            ->whereNotNull('scheduled_at')
                            ->where('scheduled_at', '<', $now);
                    });
            })->count(),
        ];

        $filterOptions = [
            'priorities' => NursingProcedure::query()
                ->select('priority')
                ->whereNotNull('priority')
                ->distinct()
                ->pluck('priority')
                ->filter()
                ->sort()
                ->values(),
            'locations' => NursingProcedure::query()
                ->select('location')
                ->whereNotNull('location')
                ->distinct()
                ->pluck('location')
                ->filter()
                ->sort()
                ->values(),
        ];

        return Inertia::render('Nurse/Procedures', [
            'procedures' => $procedures,
            'statistics' => $statistics,
            'filters' => [
                'status' => $statusFilter,
                'priority' => $priorityFilter,
                'location' => $locationFilter,
            ],
            'filterOptions' => $filterOptions,
        ]);
    }

    public function complete(Request $request, NursingProcedure $procedure)
    {
        $validated = $request->validate([
            'notes' => 'required|string',
            'complications' => 'nullable|string',
            'completed_at' => 'required|date',
        ]);

        $procedure->markCompleted([
            'completed_by' => $request->user()->id,
            'completed_at' => Carbon::parse($validated['completed_at']),
            'notes' => $validated['notes'],
            'complications' => $validated['complications'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Procedure marked as completed');
    }
}
