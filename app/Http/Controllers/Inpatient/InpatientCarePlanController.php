<?php

namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Encounter;
use App\Models\CarePlan;


class InpatientCarePlanController extends Controller
{
    /**
     * Display a list of all active encounters for care plan management.
     * Only shows patients who are actually admitted with bed assignments.
     */
    public function list(Request $request)
    {
        $query = Encounter::with(['patient', 'bedAssignments.bed.ward'])
            ->where('type', 'IPD')
            ->where('status', 'ACTIVE')
            ->whereHas('bedAssignments', function ($query) {
                $query->whereNull('released_at');
            });

        // Search by patient name or encounter number
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('encounter_number', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($patientQuery) use ($search) {
                      $patientQuery->where('first_name', 'like', "%{$search}%")
                                   ->orWhere('last_name', 'like', "%{$search}%")
                                   ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"]);
                  });
            });
        }

        // Filter by admission date range
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('admission_datetime', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('admission_datetime', '<=', $dateTo);
        }

        // Filter by ward
        if ($ward = $request->input('ward')) {
            $query->whereHas('bedAssignments.bed.ward', function ($wardQuery) use ($ward) {
                $wardQuery->where('name', $ward);
            });
        }

        // Filter by chief complaint
        if ($complaint = $request->input('complaint')) {
            $query->where('chief_complaint', 'like', "%{$complaint}%");
        }

        $encounters = $query->orderByDesc('admission_datetime')->get();

        // Get unique wards for filter dropdown
        $wards = Encounter::with('bedAssignments.bed.ward')
            ->where('type', 'IPD')
            ->where('status', 'ACTIVE')
            ->whereHas('bedAssignments', function ($query) {
                $query->whereNull('released_at');
            })
            ->get()
            ->pluck('bedAssignments')
            ->flatten()
            ->pluck('bed.ward.name')
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('Inpatient/CarePlans/List', [
            'encounters' => $encounters,
            'wards' => $wards,
            'filters' => [
                'search' => $request->input('search', ''),
                'date_from' => $request->input('date_from', ''),
                'date_to' => $request->input('date_to', ''),
                'ward' => $request->input('ward', ''),
                'complaint' => $request->input('complaint', ''),
            ],
        ]);
    }

    /**
     * Display a list of care plans for a given admission/encounter.
     */
    public function index($admissionId)
    {
        $admission = Encounter::with('patient')->findOrFail($admissionId);

        $plans = CarePlan::where('encounter_id', $admissionId)
            ->orderByDesc('plan_date')
            ->get();

        return Inertia::render('Inpatient/CarePlan', [
            'admission' => $admission,
            'plans'     => $plans,
        ]);
    }

    /**
     * Store a new inpatient care plan for a given admission/encounter.
     */
    public function store(Request $request, $admissionId)
    {
        $validated = $request->validate([
            'plan_date'      => ['required', 'date'],
            'shift'          => ['required', 'string', 'max:50'],
            'objectives'     => ['required', 'string'],
            'nursing_notes'  => ['nullable', 'string'],
            'doctor_notes'   => ['nullable', 'string'],
            'diet'           => ['nullable', 'string'],
            'hydration'      => ['nullable', 'string'],
        ]);

        $validated['encounter_id'] = $admissionId;
        $validated['created_by']   = auth()->id();

        CarePlan::create($validated);

        return redirect()
            ->route('inpatient.care-plan.index', $admissionId)
            ->with('success', 'Care plan saved successfully.');
    }

    /**
     * Display a specific care plan with related Encounter and patient details.
     */
    public function show($id)
    {
        $plan = CarePlan::with('encounter.patient')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $plan,
        ]);
    }
}
