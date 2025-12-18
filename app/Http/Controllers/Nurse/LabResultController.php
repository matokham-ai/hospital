<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LabResultController extends Controller
{
    public function index()
    {
        // Mock data - replace with actual database queries
        $pending_orders = [
            [
                'id' => 1,
                'patient_name' => 'John Doe',
                'patient_mrn' => 'MRN001',
                'test_name' => 'Complete Blood Count',
                'ordered_at' => now()->subHours(2)->toISOString(),
                'status' => 'pending',
                'priority' => 'stat',
                'ordered_by' => 'Dr. Smith',
            ],
            [
                'id' => 2,
                'patient_name' => 'Jane Smith',
                'patient_mrn' => 'MRN002',
                'test_name' => 'Blood Glucose',
                'ordered_at' => now()->subHours(1)->toISOString(),
                'status' => 'pending',
                'priority' => 'routine',
                'ordered_by' => 'Dr. Johnson',
            ],
        ];

        $recent_results = [
            [
                'id' => 3,
                'patient_name' => 'Bob Wilson',
                'patient_mrn' => 'MRN003',
                'test_name' => 'Hemoglobin',
                'ordered_at' => now()->subHours(4)->toISOString(),
                'status' => 'completed',
                'priority' => 'routine',
                'ordered_by' => 'Dr. Brown',
                'result_value' => '12.5 g/dL',
                'reference_range' => '13.5-17.5 g/dL',
                'is_critical' => false,
            ],
        ];

        $critical_alerts = [
            [
                'id' => 4,
                'patient_name' => 'Alice Johnson',
                'patient_mrn' => 'MRN004',
                'test_name' => 'Potassium',
                'ordered_at' => now()->subMinutes(30)->toISOString(),
                'status' => 'critical',
                'priority' => 'stat',
                'ordered_by' => 'Dr. Davis',
                'result_value' => '6.2 mmol/L',
                'reference_range' => '3.5-5.0 mmol/L',
                'is_critical' => true,
            ],
        ];

        return Inertia::render('Nurse/LabResults', [
            'pending_orders' => $pending_orders,
            'recent_results' => $recent_results,
            'critical_alerts' => $critical_alerts,
        ]);
    }

    public function entry($orderId)
    {
        // Mock data - replace with actual database query
        $order = [
            'id' => $orderId,
            'patient_name' => 'John Doe',
            'patient_mrn' => 'MRN001',
            'test_name' => 'Complete Blood Count',
            'test_code' => 'CBC',
            'ordered_at' => now()->subHours(2)->toISOString(),
            'priority' => 'stat',
            'reference_range' => '4.5-11.0 x10^9/L',
            'unit' => 'x10^9/L',
        ];

        return Inertia::render('Nurse/LabResultEntry', [
            'order' => $order,
        ]);
    }

    public function submit(Request $request, $orderId)
    {
        $validated = $request->validate([
            'result_value' => 'required|string',
            'result_unit' => 'nullable|string',
            'is_critical' => 'boolean',
            'notes' => 'nullable|string',
            'performed_at' => 'required|date',
        ]);

        // TODO: Save to database
        // LabResult::create([
        //     'order_id' => $orderId,
        //     'result_value' => $validated['result_value'],
        //     'result_unit' => $validated['result_unit'],
        //     'is_critical' => $validated['is_critical'],
        //     'notes' => $validated['notes'],
        //     'performed_at' => $validated['performed_at'],
        //     'recorded_by' => auth()->id(),
        // ]);

        return redirect()->route('nurse.lab-results')
            ->with('success', 'Lab result submitted successfully.');
    }

    public function history($patientId)
    {
        // Mock data - replace with actual database query
        $results = [
            [
                'id' => 1,
                'test_name' => 'Hemoglobin',
                'result_value' => '12.5 g/dL',
                'performed_at' => now()->subDays(1)->toISOString(),
            ],
            [
                'id' => 2,
                'test_name' => 'Hemoglobin',
                'result_value' => '13.0 g/dL',
                'performed_at' => now()->subDays(7)->toISOString(),
            ],
        ];

        return response()->json($results);
    }
}
