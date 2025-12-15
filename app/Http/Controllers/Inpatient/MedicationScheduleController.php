<?php
namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MedicationSchedule;
use Inertia\Inertia;

class MedicationScheduleController extends Controller
{
    public function index(Request $request)
    {
        $currentTime = now()->format('H:i');

        $schedules = MedicationSchedule::with(['patient:id,name,bed_number'])
            ->orderBy('scheduled_time')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'patientId' => $m->patient_id,
                'patientName' => $m->patient->name,
                'bedNumber' => $m->patient->bed_number,
                'medication' => $m->medication,
                'dosage' => $m->dosage,
                'time' => $m->scheduled_time,
                'status' => $m->status,
                'administeredBy' => optional($m->administeredBy)->name,
                'administeredAt' => optional($m->administered_at)?->format('H:i'),
            ]);

        return Inertia::render('Inpatient/MedicationAdmin', [
            'schedules' => [
                'data' => $schedules->toArray(),
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $schedules->count(),
                'total' => $schedules->count(),
                'from' => 1,
                'to' => $schedules->count(),
            ],
            'allSchedules' => $schedules->toArray(),
            'availableTimes' => [],
            'currentTime' => $currentTime,
            'filters' => [
                'time_filter' => 'all',
                'status_filter' => 'all',
                'per_page' => 25,
            ]
        ]);
    }

    public function markGiven(Request $request, $id)
    {
        $schedule = MedicationSchedule::findOrFail($id);
        $schedule->update([
            'status' => 'given',
            'administered_by' => auth()->id(),
            'administered_at' => now(),
        ]);

        return back()->with('success', 'Medication marked as given.');
    }
}
