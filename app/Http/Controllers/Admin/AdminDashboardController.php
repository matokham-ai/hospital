<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        // Check if user has Admin role
        if (!auth()->user()->hasRole('Admin')) {
            return redirect()->route('dashboard')->with('error', 'Access denied. Admin role required.');
        }
        
        $branchId = $request->input('branch_id');
        
        return Inertia::render('Admin/Dashboard', $this->getDashboardData($branchId));
    }

    // JSON endpoint for live refresh
    public function data()
    {
        // Check if user has Admin role
        if (!auth()->user()->hasRole('Admin')) {
            return response()->json(['error' => 'Access denied'], 403);
        }
        
        return response()->json($this->getDashboardData());
    }

    private function getDashboardData($branchId = null): array
    {
        $today = Carbon::today();
        
        // Get all branches
        $branches = DB::table('branches')
            ->where('status', 'active')
            ->select('id', 'branch_name as name', 'branch_code as code', 'location')
            ->get();

        // --- KPIs ---
        $todayAppointments = DB::table('appointments')
            ->whereDate('appointment_date', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $activeAdmissions = DB::table('beds')
            ->where('status', 'occupied')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $pendingBills = DB::table('billing_accounts')
            ->where('status', '!=', 'paid')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $labsPending = DB::table('lab_orders')
            ->where('status', 'pending')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $totalBeds = DB::table('beds')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();
        $occupiedBeds = DB::table('beds')
            ->where('status', 'occupied')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();
        $bedOccupancy = $totalBeds ? round(($occupiedBeds / $totalBeds) * 100, 1) : 0;

        $totalRevenue = DB::table('billing_accounts')
            ->where('status', 'paid')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('paid_amount');

        $patientsToday = DB::table('patients')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $activeConsultations = DB::table('encounters')
            ->where('status', 'active')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $urgentLabTests = DB::table('lab_orders')
            ->where('status', 'pending')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        // --- Recent Activity ---
        $recentActivity = collect();

        // Recent appointments (last 30 days)
        $recentAppointments = DB::table('appointments')
            ->join('patients', 'appointments.patient_id', '=', 'patients.id')
            ->where('appointments.created_at', '>=', Carbon::now()->subDays(30))
            ->when($branchId, fn($q) => $q->where('appointments.branch_id', $branchId))
            ->orderByDesc('appointments.created_at')
            ->limit(3)
            ->get([
                'appointments.id',
                'appointments.appointment_number',
                'appointments.status',
                'appointments.created_at',
                'patients.first_name',
                'patients.last_name'
            ])
            ->map(function ($appointment) {
                return [
                    'id' => 'apt-' . $appointment->id,
                    'type' => 'appointment',
                    'message' => "Appointment {$appointment->status} for {$appointment->first_name} {$appointment->last_name}",
                    'time' => Carbon::parse($appointment->created_at)->diffForHumans(),
                    'priority' => $appointment->status === 'IN_PROGRESS' ? 'high' : 
                                ($appointment->status === 'COMPLETED' ? 'normal' : 'medium')
                ];
            });

        // Recent lab orders (last 30 days)
        $recentLabs = DB::table('lab_orders')
            ->join('patients', 'lab_orders.patient_id', '=', 'patients.id')
            ->where('lab_orders.created_at', '>=', Carbon::now()->subDays(30))
            ->when($branchId, fn($q) => $q->where('lab_orders.branch_id', $branchId))
            ->orderByDesc('lab_orders.created_at')
            ->limit(2)
            ->get([
                'lab_orders.id',
                'lab_orders.test_name',
                'lab_orders.status',
                'lab_orders.created_at',
                'patients.first_name',
                'patients.last_name'
            ])
            ->map(function ($lab) {
                return [
                    'id' => 'lab-' . $lab->id,
                    'type' => 'lab',
                    'message' => "Lab test {$lab->status}: {$lab->test_name} for {$lab->first_name} {$lab->last_name}",
                    'time' => Carbon::parse($lab->created_at)->diffForHumans(),
                    'priority' => $lab->status === 'pending' ? 'high' : 'normal'
                ];
            });

        // Recent patient registrations (last 30 days)
        $recentPatients = DB::table('patients')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->limit(2)
            ->get(['id', 'first_name', 'last_name', 'created_at'])
            ->map(function ($patient) {
                return [
                    'id' => 'pat-' . $patient->id,
                    'type' => 'patient',
                    'message' => "New patient registered: {$patient->first_name} {$patient->last_name}",
                    'time' => Carbon::parse($patient->created_at)->diffForHumans(),
                    'priority' => 'normal'
                ];
            });

        // Recent invoices (last 30 days)
        $recentInvoices = DB::table('billing_accounts')
            ->join('patients', 'billing_accounts.patient_id', '=', 'patients.id')
            ->where('billing_accounts.created_at', '>=', Carbon::now()->subDays(30))
            ->when($branchId, fn($q) => $q->where('billing_accounts.branch_id', $branchId))
            ->orderByDesc('billing_accounts.created_at')
            ->limit(2)
            ->get([
                'billing_accounts.id',
                'billing_accounts.encounter_id as invoice_number',
                'billing_accounts.status',
                'billing_accounts.total_amount as net_amount',
                'billing_accounts.created_at',
                'patients.first_name',
                'patients.last_name'
            ])
            ->map(function ($invoice) {
                return [
                    'id' => 'inv-' . $invoice->id,
                    'type' => 'invoice',
                    'message' => "Invoice {$invoice->invoice_number} ({$invoice->status}) - {$invoice->first_name} {$invoice->last_name}",
                    'time' => Carbon::parse($invoice->created_at)->diffForHumans(),
                    'priority' => $invoice->status === 'unpaid' ? 'medium' : 'normal'
                ];
            });

        $recentActivity = $recentActivity
            ->merge($recentAppointments)
            ->merge($recentLabs)
            ->merge($recentPatients)
            ->merge($recentInvoices)
            ->sortByDesc(function ($item) {
                // Sort by priority and recency
                $priorityWeight = ['high' => 3, 'medium' => 2, 'normal' => 1];
                return $priorityWeight[$item['priority']] ?? 0;
            })
            ->take(8);

        // --- Alerts ---
        $alerts = [];
        
        if ($bedOccupancy > 85) {
            $alerts[] = [
                'id' => 1,
                'type' => 'warning',
                'message' => "Bed occupancy at {$bedOccupancy}% - Consider discharge planning"
            ];
        }

        if ($labsPending > 20) {
            $alerts[] = [
                'id' => 2,
                'type' => 'error',
                'message' => "{$labsPending} lab tests pending - Lab may be overloaded"
            ];
        }

        if ($pendingBills > 10) {
            $alerts[] = [
                'id' => 3,
                'type' => 'warning',
                'message' => "{$pendingBills} invoices are unpaid"
            ];
        }

        // --- Department Workload ---
        $departmentWorkload = DB::table('encounters')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw("CASE 
                    WHEN encounter_type = 'OPD' THEN 'Outpatient'
                    WHEN encounter_type = 'IPD' THEN 'Inpatient'
                    WHEN encounter_type = 'EMERGENCY' THEN 'Emergency'
                    ELSE 'General'
                END as dept"),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('dept')
            ->get()
            ->map(function ($d) {
                $colors = [
                    'Outpatient' => 'blue',
                    'Inpatient' => 'purple',
                    'Emergency' => 'red',
                    'General' => 'green'
                ];
                
                return [
                    'dept' => $d->dept,
                    'load' => min(100, $d->total * 2), // Scale the workload
                    'color' => $colors[$d->dept] ?? 'gray',
                ];
            });

        // --- Revenue Trends (Last 7 days) ---
        $revenueData = collect(range(6, 0))->map(function ($i) use ($branchId) {
            $date = Carbon::now()->subDays($i);
            return [
                'date' => $date->format('M d'),
                'revenue' => DB::table('billing_accounts')
                    ->where('status', 'paid')
                    ->whereDate('created_at', $date)
                    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->sum('paid_amount')
            ];
        });

        return [
            'userName' => auth()->user()?->name ?? 'Admin',
            'userEmail' => auth()->user()?->email ?? 'admin@example.com',
            'userRole' => 'Administrator',
            'kpis' => [
                'todayAppointments' => $todayAppointments,
                'activeAdmissions' => $activeAdmissions,
                'pendingBills' => $pendingBills,
                'labsPending' => $labsPending,
                'bedOccupancy' => $bedOccupancy,
                'totalRevenue' => $totalRevenue,
                'patientsToday' => $patientsToday,
                'activeConsultations' => $activeConsultations,
                'urgentLabTests' => $urgentLabTests,
            ],
            'recentActivity' => $recentActivity->values(),
            'alerts' => $alerts,
            'departmentWorkload' => $departmentWorkload,
            'revenueData' => $revenueData,
            'financialSummary' => $this->getFinancialSummary($today, $branchId),
            'branchPerformance' => $this->getBranchPerformance(),
            'discountSummary' => $this->getDiscountSummary($today, $branchId),
            'paymentAnalytics' => $this->getPaymentAnalytics($today, $branchId),
            'branches' => $branches,
            'selectedBranch' => $branchId ? (int) $branchId : null,
            'lastUpdated' => Carbon::now()->toISOString(),
        ];
    }

    private function getFinancialSummary($today, $branchId = null): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Build base queries with optional branch filter
        $todayPaymentsQuery = DB::table('payments')->whereDate('created_at', $today);
        $todayBillingQuery = DB::table('billing_accounts')->whereDate('created_at', $today);
        $monthPaymentsQuery = DB::table('payments')->whereDate('created_at', '>=', $thisMonth);
        $monthBillingQuery = DB::table('billing_accounts')->whereDate('created_at', '>=', $thisMonth);
        $lastMonthPaymentsQuery = DB::table('payments')->whereBetween('created_at', [$lastMonth, $lastMonthEnd]);
        $outstandingQuery = DB::table('billing_accounts')->where('status', '!=', 'closed');

        // Apply branch filter if specified
        if ($branchId) {
            $todayPaymentsQuery->where('branch_id', $branchId);
            $todayBillingQuery->where('branch_id', $branchId);
            $monthPaymentsQuery->where('branch_id', $branchId);
            $monthBillingQuery->where('branch_id', $branchId);
            $lastMonthPaymentsQuery->where('branch_id', $branchId);
            $outstandingQuery->where('branch_id', $branchId);
        }

        // Today's financials
        $todayRevenue = $todayPaymentsQuery->sum('amount');
        $todayPayments = DB::table('payments')->whereDate('created_at', $today)->when($branchId, fn($q) => $q->where('branch_id', $branchId))->count();
        $todayDiscounts = $todayBillingQuery->sum('discount_amount');

        // This month's financials
        $monthRevenue = $monthPaymentsQuery->sum('amount');
        $monthInvoices = DB::table('billing_accounts')->whereDate('created_at', '>=', $thisMonth)->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('total_amount');
        $monthDiscounts = DB::table('billing_accounts')->whereDate('created_at', '>=', $thisMonth)->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('discount_amount');
        $monthNet = DB::table('billing_accounts')->whereDate('created_at', '>=', $thisMonth)->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('net_amount');

        // Last month's financials for comparison
        $lastMonthRevenue = $lastMonthPaymentsQuery->sum('amount');

        // Outstanding balances
        $totalOutstanding = $outstandingQuery->sum('balance');

        // Calculate growth
        $revenueGrowth = $lastMonthRevenue > 0 
            ? round((($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 0;

        return [
            'today' => [
                'revenue' => (float) $todayRevenue,
                'payments_count' => (int) $todayPayments,
                'discounts' => (float) $todayDiscounts,
                'avg_payment' => $todayPayments > 0 ? round($todayRevenue / $todayPayments, 2) : 0
            ],
            'month' => [
                'revenue' => (float) $monthRevenue,
                'invoiced' => (float) $monthInvoices,
                'discounts' => (float) $monthDiscounts,
                'net' => (float) $monthNet,
                'discount_percentage' => $monthInvoices > 0 ? round(($monthDiscounts / $monthInvoices) * 100, 2) : 0,
                'collection_rate' => $monthNet > 0 ? round(($monthRevenue / $monthNet) * 100, 2) : 0
            ],
            'outstanding' => (float) $totalOutstanding,
            'growth' => [
                'revenue_growth' => $revenueGrowth,
                'trend' => $revenueGrowth >= 0 ? 'up' : 'down'
            ]
        ];
    }

    private function getBranchPerformance(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();

        return DB::table('branches')
            ->leftJoin('payments', function($join) use ($thisMonth) {
                $join->on('branches.id', '=', 'payments.branch_id')
                    ->whereDate('payments.created_at', '>=', $thisMonth);
            })
            ->leftJoin('billing_accounts', function($join) use ($thisMonth) {
                $join->on('branches.id', '=', 'billing_accounts.branch_id')
                    ->whereDate('billing_accounts.created_at', '>=', $thisMonth);
            })
            ->select(
                'branches.id',
                'branches.branch_name',
                'branches.branch_code',
                'branches.location',
                DB::raw('COALESCE(SUM(payments.amount), 0) as revenue'),
                DB::raw('COALESCE(COUNT(DISTINCT payments.id), 0) as transactions'),
                DB::raw('COALESCE(SUM(billing_accounts.discount_amount), 0) as discounts'),
                DB::raw('COALESCE(SUM(billing_accounts.balance), 0) as outstanding'),
                DB::raw('COALESCE(SUM(billing_accounts.total_amount), 0) as invoiced')
            )
            ->where('branches.status', 'active')
            ->groupBy('branches.id', 'branches.branch_name', 'branches.branch_code', 'branches.location')
            ->orderByDesc(DB::raw('COALESCE(SUM(payments.amount), 0)'))
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->branch_name,
                    'code' => $branch->branch_code,
                    'location' => $branch->location,
                    'revenue' => (float) $branch->revenue,
                    'transactions' => (int) $branch->transactions,
                    'discounts' => (float) $branch->discounts,
                    'outstanding' => (float) $branch->outstanding,
                    'invoiced' => (float) $branch->invoiced,
                    'avg_transaction' => $branch->transactions > 0 
                        ? round($branch->revenue / $branch->transactions, 2) 
                        : 0,
                    'discount_rate' => $branch->invoiced > 0 
                        ? round(($branch->discounts / $branch->invoiced) * 100, 2) 
                        : 0
                ];
            });
    }

    private function getDiscountSummary($today, $branchId = null): array
    {
        $thisMonth = Carbon::now()->startOfMonth();

        // Today's discounts
        $todayDiscounts = DB::table('billing_accounts')
            ->whereDate('created_at', $today)
            ->where('discount_amount', '>', 0)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        
        $todayTotal = (float) $todayDiscounts->sum('discount_amount');
        $todayCount = $todayDiscounts->count();

        // Month's discounts
        $monthDiscounts = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        
        $monthTotal = (float) $monthDiscounts->sum('discount_amount');
        $monthCount = $monthDiscounts->count();

        // Discount by type
        $byType = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select('discount_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(discount_amount) as total'))
            ->groupBy('discount_type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => ucfirst($item->discount_type),
                    'count' => (int) $item->count,
                    'total' => (float) $item->total
                ];
            });

        // Top approvers
        $topApprovers = DB::table('billing_accounts')
            ->join('users', 'billing_accounts.discount_approved_by', '=', 'users.id')
            ->whereDate('billing_accounts.created_at', '>=', $thisMonth)
            ->where('billing_accounts.discount_amount', '>', 0)
            ->when($branchId, fn($q) => $q->where('billing_accounts.branch_id', $branchId))
            ->select('users.name', DB::raw('COUNT(*) as count'), DB::raw('SUM(billing_accounts.discount_amount) as total'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc(DB::raw('SUM(billing_accounts.discount_amount)'))
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'count' => (int) $item->count,
                    'total' => (float) $item->total
                ];
            });

        // Compliance
        $totalDiscounts = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();
        
        $approvedDiscounts = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0)
            ->whereNotNull('discount_approved_by')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        return [
            'today' => [
                'total' => $todayTotal,
                'count' => $todayCount,
                'average' => $todayCount > 0 ? round($todayTotal / $todayCount, 2) : 0
            ],
            'month' => [
                'total' => $monthTotal,
                'count' => $monthCount,
                'average' => $monthCount > 0 ? round($monthTotal / $monthCount, 2) : 0
            ],
            'by_type' => $byType,
            'top_approvers' => $topApprovers,
            'compliance' => [
                'total' => $totalDiscounts,
                'approved' => $approvedDiscounts,
                'approval_rate' => $totalDiscounts > 0 
                    ? round(($approvedDiscounts / $totalDiscounts) * 100, 2) 
                    : 0
            ]
        ];
    }

    private function getPaymentAnalytics($today, $branchId = null): array
    {
        $thisMonth = Carbon::now()->startOfMonth();

        // Payment methods breakdown
        $byMethod = DB::table('payments')
            ->whereDate('created_at', '>=', $thisMonth)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select('method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
            ->groupBy('method')
            ->get()
            ->map(function ($item) {
                return [
                    'method' => ucfirst(str_replace('_', ' ', $item->method)),
                    'count' => (int) $item->count,
                    'total' => (float) $item->total
                ];
            });

        // Today's payment summary
        $todayPayments = DB::table('payments')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        $todayTotal = (float) $todayPayments->sum('amount');
        $todayCount = $todayPayments->count();

        // Month's payment summary
        $monthPayments = DB::table('payments')
            ->whereDate('created_at', '>=', $thisMonth)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        $monthTotal = (float) $monthPayments->sum('amount');
        $monthCount = $monthPayments->count();

        // Cashier performance
        $cashierPerformance = DB::table('payments')
            ->whereDate('created_at', '>=', $thisMonth)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                'received_by',
                DB::raw('COUNT(*) as transactions'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('received_by')
            ->orderByDesc(DB::raw('SUM(amount)'))
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'cashier' => $item->received_by,
                    'transactions' => (int) $item->transactions,
                    'total' => (float) $item->total,
                    'average' => $item->transactions > 0 
                        ? round($item->total / $item->transactions, 2) 
                        : 0
                ];
            });

        return [
            'today' => [
                'total' => $todayTotal,
                'count' => $todayCount,
                'average' => $todayCount > 0 ? round($todayTotal / $todayCount, 2) : 0
            ],
            'month' => [
                'total' => $monthTotal,
                'count' => $monthCount,
                'average' => $monthCount > 0 ? round($monthTotal / $monthCount, 2) : 0
            ],
            'by_method' => $byMethod,
            'top_cashiers' => $cashierPerformance
        ];
    }
}