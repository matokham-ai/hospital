<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\NursingNote;
use App\Models\Patient;

class DocumentationController extends Controller
{
    public function index()
    {
        $recentNotes = NursingNote::query()
            ->with([
                'patient:id,first_name,last_name,hospital_id',
                'author:id,name',
            ])
            ->orderByDesc('note_datetime')
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(function (NursingNote $note) {
                $patient = $note->patient;
                $timestamp = $note->note_datetime ?? $note->created_at;

                return [
                    'id' => $note->id,
                    'patient_name' => $patient?->name ?? 'Unknown Patient',
                    'patient_mrn' => $patient?->hospital_id ?? $note->patient_id,
                    'note_type' => $note->note_type,
                    'content' => $note->content,
                    'created_at' => $timestamp?->toIso8601String(),
                    'created_by' => $note->author?->name ?? 'System',
                ];
            });

        $patients = Patient::query()
            ->select(['id', 'first_name', 'last_name', 'hospital_id'])
            ->orderBy('first_name')
            ->limit(50)
            ->get()
            ->map(function (Patient $patient) {
                return [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'mrn' => $patient->hospital_id ?? $patient->id,
                ];
            });

        return Inertia::render('Nurse/NursingNotes', [
            'recent_notes' => $recentNotes,
            'patients' => $patients,
        ]);
    }

    public function storeNote(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|string|exists:patients,id',
            'note_type' => 'required|in:progress,shift,admission,discharge',
            'content' => 'required|string',
        ]);

        NursingNote::create([
            'patient_id' => $validated['patient_id'],
            'note_type' => $validated['note_type'],
            'content' => $validated['content'],
            'created_by' => $request->user()?->id,
            'note_datetime' => now(),
        ]);

        return redirect()
            ->route('nurse.documentation.index')
            ->with('success', 'Note saved successfully.');
    }

    public function incident()
    {
        // Mock data
        $recent_incidents = [
            [
                'id' => 1,
                'patient_name' => 'John Doe',
                'incident_type' => 'fall',
                'severity' => 'minor',
                'description' => 'Patient slipped while walking to bathroom.',
                'reported_at' => now()->subHours(3)->toISOString(),
                'reported_by' => 'Nurse Smith',
                'status' => 'under_review',
            ],
        ];

        $patients = [
            ['id' => 1, 'name' => 'John Doe', 'mrn' => 'MRN001'],
            ['id' => 2, 'name' => 'Jane Smith', 'mrn' => 'MRN002'],
            ['id' => 3, 'name' => 'Bob Wilson', 'mrn' => 'MRN003'],
        ];

        return Inertia::render('Nurse/IncidentReport', [
            'recent_incidents' => $recent_incidents,
            'patients' => $patients,
        ]);
    }

    public function storeIncident(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer',
            'incident_type' => 'required|string',
            'severity' => 'required|in:minor,moderate,major,critical',
            'location' => 'required|string',
            'description' => 'required|string',
            'immediate_action' => 'required|string',
            'witnesses' => 'nullable|string',
            'occurred_at' => 'required|date',
        ]);

        // TODO: Save to database
        // IncidentReport::create([
        //     'patient_id' => $validated['patient_id'],
        //     'incident_type' => $validated['incident_type'],
        //     'severity' => $validated['severity'],
        //     'location' => $validated['location'],
        //     'description' => $validated['description'],
        //     'immediate_action' => $validated['immediate_action'],
        //     'witnesses' => $validated['witnesses'],
        //     'occurred_at' => $validated['occurred_at'],
        //     'reported_by' => auth()->id(),
        // ]);

        return redirect()->route('nurse.documentation.incident')
            ->with('success', 'Incident report submitted successfully.');
    }
}
