<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Encounter;
use App\Models\IntakeOutput;
use Carbon\Carbon;

class IntakeOutputController extends Controller
{
    public function index()
    {
        // List all patients with active intake/output monitoring
        $encounters = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->whereHas('bedAssignments', function($query) {
                $query->whereNull('released_at');
            })
            ->get()
            ->map(function($encounter) {
                $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
                return [
                    'id' => $encounter->id,
                    'patient_name' => $encounter->patient->name,
                    'patient_id' => $encounter->patient->id,
                    'bed' => $bedAssignment ? $bedAssignment->bed->bed_number : 'N/A',
                    'ward' => $bedAssignment ? ($bedAssignment->bed->ward->name ?? 'N/A') : 'N/A',
                ];
            });

        return Inertia::render('Nurse/IPD/IntakeOutputList', [
            'encounters' => $encounters,
        ]);
    }

    public function show(Request $request, $encounterId)
    {
        $encounter = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->findOrFail($encounterId);
        
        $bedAssignment = $encounter->bedAssignments->where('released_at', null)->first();
        
        $patient = [
            'id' => $encounter->patient->id,
            'name' => $encounter->patient->name,
            'age' => $encounter->patient->age ?? 0,
            'gender' => $encounter->patient->gender ?? 'U',
            'bed' => $bedAssignment ? $bedAssignment->bed->bed_number : 'N/A',
            'ward' => $bedAssignment ? ($bedAssignment->bed->ward->name ?? 'N/A') : 'N/A',
        ];

        // Get records for last 24 hours
        $last24Hours = Carbon::now()->subHours(24);
        $records = IntakeOutput::where('encounter_id', $encounterId)
            ->where('recorded_at', '>=', $last24Hours)
            ->orderBy('recorded_at', 'desc')
            ->get()
            ->map(function($record) {
                return [
                    'id' => $record->id,
                    'time' => Carbon::parse($record->recorded_at)->format('H:i'),
                    'type' => $record->type,
                    'category' => $record->category,
                    'amount' => $record->amount,
                    'route' => $record->route ?? 'N/A',
                    'notes' => $record->notes,
                ];
            });

        // Calculate shift start (assuming 8-hour shifts starting at 7am, 3pm, 11pm)
        $currentHour = Carbon::now()->hour;
        if ($currentHour >= 7 && $currentHour < 15) {
            $shiftStart = Carbon::today()->addHours(7);
        } elseif ($currentHour >= 15 && $currentHour < 23) {
            $shiftStart = Carbon::today()->addHours(15);
        } else {
            $shiftStart = Carbon::today()->subDay()->addHours(23);
        }

        // Calculate summaries
        $intake24h = IntakeOutput::where('encounter_id', $encounterId)
            ->where('type', 'intake')
            ->where('recorded_at', '>=', $last24Hours)
            ->sum('amount');

        $output24h = IntakeOutput::where('encounter_id', $encounterId)
            ->where('type', 'output')
            ->where('recorded_at', '>=', $last24Hours)
            ->sum('amount');

        $intakeShift = IntakeOutput::where('encounter_id', $encounterId)
            ->where('type', 'intake')
            ->where('recorded_at', '>=', $shiftStart)
            ->sum('amount');

        $outputShift = IntakeOutput::where('encounter_id', $encounterId)
            ->where('type', 'output')
            ->where('recorded_at', '>=', $shiftStart)
            ->sum('amount');

        $summary = [
            'total_intake_24h' => $intake24h,
            'total_output_24h' => $output24h,
            'balance_24h' => $intake24h - $output24h,
            'total_intake_shift' => $intakeShift,
            'total_output_shift' => $outputShift,
            'balance_shift' => $intakeShift - $outputShift,
        ];

        return Inertia::render('Nurse/IPD/IntakeOutput', [
            'patient' => $patient,
            'encounter_id' => $encounterId,
            'records' => $records,
            'summary' => $summary,
            'shift' => [
                'start' => $shiftStart->format('H:i'),
                'current' => Carbon::now()->format('H:i'),
            ],
        ]);
    }

    public function store(Request $request, $encounterId)
    {
        $validated = $request->validate([
            'type' => 'required|in:intake,output',
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'route' => 'required|string',
            'notes' => 'nullable|string',
            'time' => 'required|string', // HH:MM format
        ]);

        // Combine today's date with the provided time
        $recordedAt = Carbon::today()->setTimeFromTimeString($validated['time']);
        
        // If time is in the future, assume it's from yesterday
        if ($recordedAt->isFuture()) {
            $recordedAt->subDay();
        }

        IntakeOutput::create([
            'encounter_id' => $encounterId,
            'type' => $validated['type'],
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'route' => $validated['route'],
            'notes' => $validated['notes'],
            'recorded_at' => $recordedAt,
            'recorded_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Intake/Output record added successfully');
    }
}
