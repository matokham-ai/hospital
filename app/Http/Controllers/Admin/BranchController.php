<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of branches
     */
    public function index()
    {
        $branches = Branch::withCount(['users', 'payments', 'invoices'])
            ->orderBy('is_main_branch', 'desc')
            ->orderBy('branch_name')
            ->get();

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store a newly created branch
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_code' => 'required|string|max:10|unique:branches,branch_code',
            'branch_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'status' => 'required|in:active,inactive',
            'is_main_branch' => 'boolean',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $branch = Branch::create($validated);

        return redirect()->back()->with('success', 'Branch created successfully');
    }

    /**
     * Update the specified branch
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'branch_code' => 'required|string|max:10|unique:branches,branch_code,' . $branch->id,
            'branch_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'status' => 'required|in:active,inactive',
            'is_main_branch' => 'boolean',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $branch->update($validated);

        return redirect()->back()->with('success', 'Branch updated successfully');
    }

    /**
     * Remove the specified branch
     */
    public function destroy(Branch $branch)
    {
        // Check if branch has related records
        if ($branch->users()->count() > 0 || $branch->payments()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete branch with existing users or transactions');
        }

        $branch->delete();

        return redirect()->back()->with('success', 'Branch deleted successfully');
    }

    /**
     * Toggle branch status
     */
    public function toggleStatus(Branch $branch)
    {
        $branch->update([
            'status' => $branch->status === 'active' ? 'inactive' : 'active'
        ]);

        return redirect()->back()->with('success', 'Branch status updated successfully');
    }

    /**
     * Show branch dashboard with comprehensive statistics
     */
    public function dashboard(Branch $branch)
    {
        // Patient Statistics
        $totalPatients = \DB::table('patients')->where('branch_id', $branch->id)->count();
        
        $patientsWithRecentEncounters = \DB::table('patients')
            ->where('patients.branch_id', $branch->id)
            ->whereExists(function($query) {
                $query->select(\DB::raw(1))
                    ->from('encounters')
                    ->whereColumn('encounters.patient_id', 'patients.id')
                    ->where('encounters.created_at', '>=', now()->subMonths(6));
            })
            ->count();
        
        $patientStats = [
            'total' => $totalPatients,
            'active' => $patientsWithRecentEncounters,
            'new_this_month' => \DB::table('patients')
                ->where('branch_id', $branch->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'growth_rate' => $this->calculatePatientGrowthRate($branch->id),
        ];

        // Financial Statistics
        $financialStats = [
            'today_revenue' => \DB::table('payments')
                ->where('branch_id', $branch->id)
                ->whereDate('created_at', today())
                ->sum('amount'),
            'month_revenue' => \DB::table('payments')
                ->where('branch_id', $branch->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount'),
            'outstanding' => \DB::table('billing_accounts')
                ->where('branch_id', $branch->id)
                ->sum('balance'),
            'collection_rate' => $this->calculateCollectionRate($branch->id),
            'growth_rate' => $this->calculateRevenueGrowthRate($branch->id),
        ];

        // Operations Statistics
        $operationsStats = [
            'appointments_today' => \DB::table('appointments')
                ->where('branch_id', $branch->id)
                ->whereDate('appointment_date', today())
                ->count(),
            'appointments_pending' => \DB::table('appointments')
                ->where('branch_id', $branch->id)
                ->whereDate('appointment_date', today())
                ->where('status', 'scheduled')
                ->count(),
            'beds_total' => \DB::table('beds')
                ->where('branch_id', $branch->id)
                ->count(),
            'beds_occupied' => \DB::table('beds')
                ->where('branch_id', $branch->id)
                ->where('status', 'occupied')
                ->count(),
            'occupancy_rate' => $this->calculateOccupancyRate($branch->id),
        ];

        // Staff Statistics
        $staffStats = [
            'total' => \DB::table('users')->where('branch_id', $branch->id)->count(),
            'doctors' => \DB::table('users')
                ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('users.branch_id', $branch->id)
                ->where('roles.name', 'doctor')
                ->count(),
            'nurses' => \DB::table('users')
                ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('users.branch_id', $branch->id)
                ->where('roles.name', 'nurse')
                ->count(),
            'active_today' => \DB::table('users')
                ->where('branch_id', $branch->id)
                ->whereDate('updated_at', today())
                ->count(),
        ];

        // Pharmacy Statistics
        $pharmacyStats = [
            'prescriptions_today' => \DB::table('prescriptions')
                ->where('branch_id', $branch->id)
                ->whereDate('created_at', today())
                ->count(),
            'prescriptions_month' => \DB::table('prescriptions')
                ->where('branch_id', $branch->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'low_stock_items' => 0, // Pharmacy stock table structure varies
        ];

        // Laboratory Statistics
        $laboratoryStats = [
            'tests_today' => \DB::table('lab_orders')
                ->where('branch_id', $branch->id)
                ->whereDate('created_at', today())
                ->count(),
            'tests_pending' => \DB::table('lab_orders')
                ->where('branch_id', $branch->id)
                ->where('status', 'pending')
                ->count(),
            'tests_completed' => \DB::table('lab_orders')
                ->where('branch_id', $branch->id)
                ->whereDate('created_at', today())
                ->where('status', 'completed')
                ->count(),
        ];

        return Inertia::render('Admin/Branches/Dashboard', [
            'branch' => $branch,
            'stats' => [
                'patients' => $patientStats,
                'financial' => $financialStats,
                'operations' => $operationsStats,
                'staff' => $staffStats,
                'pharmacy' => $pharmacyStats,
                'laboratory' => $laboratoryStats,
            ],
        ]);
    }

    /**
     * Calculate patient growth rate
     */
    private function calculatePatientGrowthRate($branchId)
    {
        $currentMonth = \DB::table('patients')
            ->where('branch_id', $branchId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $lastMonth = \DB::table('patients')
            ->where('branch_id', $branchId)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();

        if ($lastMonth == 0) return 0;

        return round((($currentMonth - $lastMonth) / $lastMonth) * 100, 1);
    }

    /**
     * Calculate revenue growth rate
     */
    private function calculateRevenueGrowthRate($branchId)
    {
        $currentMonth = \DB::table('payments')
            ->where('branch_id', $branchId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $lastMonth = \DB::table('payments')
            ->where('branch_id', $branchId)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('amount');

        if ($lastMonth == 0) return 0;

        return round((($currentMonth - $lastMonth) / $lastMonth) * 100, 1);
    }

    /**
     * Calculate collection rate
     */
    private function calculateCollectionRate($branchId)
    {
        $invoiced = \DB::table('billing_accounts')
            ->where('branch_id', $branchId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount');

        $collected = \DB::table('payments')
            ->where('branch_id', $branchId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        if ($invoiced == 0) return 0;

        return round(($collected / $invoiced) * 100, 1);
    }

    /**
     * Calculate bed occupancy rate
     */
    private function calculateOccupancyRate($branchId)
    {
        $total = \DB::table('beds')
            ->where('branch_id', $branchId)
            ->count();

        $occupied = \DB::table('beds')
            ->where('branch_id', $branchId)
            ->where('status', 'occupied')
            ->count();

        if ($total == 0) return 0;

        return round(($occupied / $total) * 100, 1);
    }
}
