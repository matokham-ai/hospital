<?php

namespace App\Http\Controllers;

use App\Models\OpdAppointment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpdTriageController extends Controller
{
    public function index()
    {
        $pendingTriage = OpdAppointment::with(['patient', 'physician'])
            ->whereDate('appointment_date', today())
            ->where('status', 'WAITING')
            ->where('triage_status', 'pending')
            ->orderBy('checked_in_at')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'appointment_number' => $appointment->appointment_number,
                    'queue_number' => $appointment->queue_number,
                    'patient' => [
                        'id' => $appointment->patient->id,
                        'name' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                        'age' => $appointment->patient->age ?? 'N/A',
                        'gender' => $appointment->patient->gender ?? 'N/A',
                    ],
                    'chief_complaint' => $appointment->chief_complaint,
                    'checked_in_at' => $appointment->checked_in_at?->format('H:i'),
                    'waiting_time' => $appointment->waiting_time,
                ];
            });

        return Inertia::render('OPD/Triage/Index', [
            'pendingTriage' => $pendingTriage,
            'stats' => [
                'pending' => $pendingTriage->count(),
                'completed' => OpdAppointment::whereDate('appointment_date', today())
                    ->where('triage_status', 'completed')
                    ->count(),
            ]
        ]);
    }

    public function show($id)
    {
        $appointment = OpdAppointment::with(['patient', 'physician'])->findOrFail($id);

        return Inertia::render('OPD/Triage/Form', [
            'appointment' => [
                'id' => $appointment->id,
                'appointment_number' => $appointment->appointment_number,
                'patient' => [
                    'id' => $appointment->patient->id,
                    'name' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                    'age' => $appointment->patient->age ?? 'N/A',
                    'gender' => $appointment->patient->gender ?? 'N/A',
                ],
                'chief_complaint' => $appointment->chief_complaint,
                'triage_status' => $appointment->triage_status,
                'temperature' => $appointment->temperature,
                'blood_pressure' => $appointment->blood_pressure,
                'heart_rate' => $appointment->heart_rate,
                'respiratory_rate' => $appointment->respiratory_rate,
                'oxygen_saturation' => $appointment->oxygen_saturation,
                'weight' => $appointment->weight,
                'height' => $appointment->height,
                'triage_notes' => $appointment->triage_notes,
            ]
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'temperature' => 'nullable|numeric|min:30|max:45',
            'blood_pressure' => 'nullable|string|max:20',
            'heart_rate' => 'nullable|integer|min:30|max:250',
            'respiratory_rate' => 'nullable|integer|min:5|max:60',
            'oxygen_saturation' => 'nullable|integer|min:50|max:100',
            'weight' => 'nullable|numeric|min:0|max:500',
            'height' => 'nullable|numeric|min:0|max:300',
            'pain_level' => 'nullable|integer|min:0|max:10',
            'triage_notes' => 'nullable|string',
        ]);

        $appointment = OpdAppointment::findOrFail($id);
        
        // Calculate triage score and level
        $triageService = new \App\Services\TriageService();
        $triageData = array_merge($validated, [
            'chief_complaint' => $appointment->chief_complaint
        ]);
        $triageResult = $triageService->calculateTriageScore($triageData);
        
        // Merge triage results with validated data
        $dataToSave = array_merge($validated, $triageResult);
        
        $appointment->completeTriage($dataToSave, auth()->id());

        $levelMessage = match($triageResult['triage_level']) {
            'emergency' => '🚨 EMERGENCY - Immediate attention required',
            'urgent' => '⚠️ URGENT - Priority consultation needed',
            'non-urgent' => '📋 NON-URGENT - Standard queue',
            'routine' => '✅ ROUTINE - Normal wait time',
            default => 'Triage completed'
        };

        return redirect()->route('opd.triage.index')
            ->with('success', "Triage completed: {$levelMessage}");
    }

    public function skip($id)
    {
        $appointment = OpdAppointment::findOrFail($id);
        $appointment->skipTriage();

        return redirect()->route('opd.triage.index')
            ->with('success', 'Triage skipped');
    }
}
