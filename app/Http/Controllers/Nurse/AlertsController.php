<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Alert;
use App\Models\Patient;

class AlertsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = 5;

        $query = Alert::with(['patient'])
            ->where('status', 'active');

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('patient', function($patientQuery) use ($search) {
                    $patientQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('id', 'like', "%{$search}%");
                })
                ->orWhere('type', 'like', "%{$search}%")
                ->orWhere('priority', 'like', "%{$search}%")
                ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $alerts = $query->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return Inertia::render('Nurse/Alerts/Index', [
            'alerts' => $alerts->getCollection()->map(function($alert) {
                return [
                    'id' => $alert->id,
                    'patient_name' => $alert->patient->name,
                    'patient_id' => $alert->patient_id,
                    'type' => $alert->type,
                    'priority' => $alert->priority,
                    'message' => $alert->message,
                    'created_at' => $alert->created_at,
                    'status' => $alert->status
                ];
            }),
            'pagination' => [
                'current_page' => $alerts->currentPage(),
                'total' => $alerts->total(),
                'per_page' => $alerts->perPage(),
                'last_page' => $alerts->lastPage(),
                'from' => $alerts->firstItem(),
                'to' => $alerts->lastItem(),
            ],
            'filters' => [
                'search' => $search
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'type' => 'required|string|in:medical,safety,medication,vital_signs,other',
            'priority' => 'required|string|in:low,medium,high,critical',
            'message' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000'
        ]);

        Alert::create([
            'patient_id' => $validated['patient_id'],
            'type' => $validated['type'],
            'priority' => $validated['priority'],
            'message' => $validated['message'],
            'notes' => $validated['notes'],
            'status' => 'active',
            'created_by' => auth()->id()
        ]);

        return redirect()
            ->route('nurse.patients.show', $validated['patient_id'])
            ->with('success', 'Alert created successfully.');
    }
}
