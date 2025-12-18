<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Encounter;
use App\Models\MedicationAdministration;
use Carbon\Carbon;

class MedicationsController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();
        $search = $request->get('search', '');
        $perPage = 5;
        
        $query = MedicationAdministration::with(['encounter.patient', 'encounter.bedAssignments.bed.ward', 'prescription'])
            ->where('status', 'due')
            ->whereBetween('scheduled_time', [$now->copy()->subHours(2), $now->copy()->addHours(4)]);

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('encounter.patient', function($patientQuery) use ($search) {
                    $patientQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('id', 'like', "%{$search}%");
                })
                ->orWhereHas('prescription', function($prescriptionQuery) use ($search) {
                    $prescriptionQuery->where('drug_name', 'like', "%{$search}%");
                });
            });
        }

        $pendingMedications = $query->orderBy('scheduled_time')->paginate($perPage);

        return Inertia::render('Nurse/Medications/Index', [
            'medications' => $pendingMedications->getCollection()->map(function($med) {
                $bedAssignment = $med->encounter->bedAssignments->where('released_at', null)->first();
                return [
                    'id' => $med->id,
                    'encounter_id' => $med->encounter_id,
                    'patient_name' => $med->encounter->patient->name,
                    'room' => $bedAssignment ? 
                        ($bedAssignment->bed->ward->name ?? 'Ward') . ' - Bed ' . $bedAssignment->bed->bed_number : 
                        'No bed assigned',
                    'medication_name' => $med->prescription->drug_name ?? 'Unknown',
                    'dosage' => $med->prescription->dosage ?? 'Unknown',
                    'route' => 'Oral', // Default route since it's not in the prescription model
                    'scheduled_time' => $med->scheduled_time,
                    'status' => $med->status,
                    'is_overdue' => Carbon::parse($med->scheduled_time)->isPast()
                ];
            }),
            'pagination' => [
                'current_page' => $pendingMedications->currentPage(),
                'total' => $pendingMedications->total(),
                'per_page' => $pendingMedications->perPage(),
                'last_page' => $pendingMedications->lastPage(),
                'from' => $pendingMedications->firstItem(),
                'to' => $pendingMedications->lastItem(),
            ],
            'filters' => [
                'search' => $search
            ]
        ]);
    }

    public function show(Encounter $encounter)
    {
        $encounter->load(['patient', 'medicationAdministrations' => function($query) {
            $query->with('prescription')->orderBy('scheduled_time', 'desc')->limit(20);
        }]);

        return Inertia::render('Nurse/Medications/Show', [
            'encounter' => $encounter,
            'patient' => [
                'id' => $encounter->patient->id,
                'name' => $encounter->patient->name,
                'date_of_birth' => $encounter->patient->date_of_birth,
                'gender' => $encounter->patient->gender,
                'allergies' => $encounter->patient->allergies,
                'chronic_conditions' => $encounter->patient->chronic_conditions
            ],
            'medications' => $encounter->medicationAdministrations->map(function($med) {
                return [
                    'id' => $med->id,
                    'medication_name' => $med->prescription->drug_name ?? 'Unknown',
                    'dosage' => $med->prescription->dosage ?? 'Unknown',
                    'route' => 'Oral', // Default route
                    'scheduled_time' => $med->scheduled_time,
                    'status' => $med->status,
                    'notes' => $med->notes,
                    'administered_at' => $med->administered_at,
                    'administered_by' => $med->administered_by
                ];
            })
        ]);
    }

    public function administer(Request $request, Encounter $encounter)
    {
        $validated = $request->validate([
            'medication_id' => 'required|exists:medication_administrations,id',
            'notes' => 'nullable|string|max:500'
        ]);

        $medication = MedicationAdministration::findOrFail($validated['medication_id']);
        
        $medication->update([
            'status' => 'given',
            'administered_at' => now(),
            'administered_by' => auth()->id(),
            'administration_notes' => $validated['notes']
        ]);

        return redirect()->route('nurse.medications')->with('success', 'Medication administered successfully.');
    }
}