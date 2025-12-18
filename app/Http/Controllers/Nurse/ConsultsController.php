<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConsultsController extends Controller
{
    public function index()
    {
        $consults = [
            [
                'id' => 1,
                'patient_id' => 101,
                'patient_name' => 'John Doe',
                'mrn' => 'MRN-2024-001',
                'location' => 'Ward A - Bed 12',
                'specialty' => 'Cardiology',
                'urgency' => 'urgent',
                'reason' => 'Chest pain and elevated troponin',
                'requested_by' => 'Dr. Smith',
                'requested_at' => now()->subHours(2),
                'status' => 'pending',
                'response' => null,
            ],
            [
                'id' => 2,
                'patient_id' => 102,
                'patient_name' => 'Jane Smith',
                'mrn' => 'MRN-2024-002',
                'location' => 'Ward B - Bed 5',
                'specialty' => 'Orthopedics',
                'urgency' => 'routine',
                'reason' => 'Hip fracture management',
                'requested_by' => 'Dr. Johnson',
                'requested_at' => now()->subDays(1),
                'status' => 'completed',
                'response' => 'Surgical intervention recommended',
            ],
        ];

        $statistics = [
            'pending' => 5,
            'in_progress' => 3,
            'completed_today' => 8,
        ];

        return Inertia::render('Nurse/Consults', [
            'consults' => $consults,
            'statistics' => $statistics,
        ]);
    }

    public function request(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|integer',
            'specialty' => 'required|string',
            'urgency' => 'required|in:stat,urgent,routine',
            'reason' => 'required|string',
            'clinical_summary' => 'required|string',
        ]);

        return response()->json([
            'message' => 'Consult request submitted successfully',
        ]);
    }
}
