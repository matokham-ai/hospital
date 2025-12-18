<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Models\MasterDataAudit;
use App\Services\QueryOptimizationService;
use App\Services\MasterDataCacheService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    protected QueryOptimizationService $queryService;
    protected MasterDataCacheService $cacheService;
    protected AuditService $auditService;
    
    public function __construct(
        QueryOptimizationService $queryService, 
        MasterDataCacheService $cacheService,
        AuditService $auditService
    ) {
        $this->queryService = $queryService;
        $this->cacheService = $cacheService;
        $this->auditService = $auditService;
    }
    /**
     * Display the admin dashboard with master data statistics and navigation
     */
    public function dashboard(Request $request): Response
    {
        $branchId = $request->get('branch_id');
        
        // Get master data stats - either for specific branch or all branches
        if ($branchId) {
            $masterDataStats = $this->getMasterDataStatsByBranch($branchId);
        } else {
            // For "All Branches", calculate totals across all branches
            $masterDataStats = $this->getMasterDataStatistics();
        }
        
        // Get only 3 recent activities for dashboard overview
        $recentActivity = $this->auditService->getRecentActivity(3);
        $systemStats = $this->getSystemStats($branchId);
        $today = \Carbon\Carbon::today();
        
        return Inertia::render('Admin/AdminDashboard', [
            'masterDataStats' => $masterDataStats,
            'recentActivity' => $recentActivity->toArray(),
            'systemStats' => $systemStats,
            'financialSummary' => $this->getFinancialSummary($today, $branchId),
            'branchPerformance' => $this->getBranchPerformance(),
            'discountSummary' => $this->getDiscountSummary($today, $branchId),
            'paymentAnalytics' => $this->getPaymentAnalytics($today, $branchId),
            'branches' => $this->getBranches(),
            'selectedBranch' => $branchId ? (int)$branchId : null,
            'user' => auth()->user(),
            'permissions' => auth()->user()->getAllPermissions()->pluck('name')->toArray(),
        ]);
    }

    /**
     * Get master data statistics for dashboard
     */
    public function getMasterDataStats(): JsonResponse
    {
        $stats = $this->queryService->getDashboardStatsOptimized();
        
        return response()->json($stats);
    }

    /**
     * Get recent activity feed for dashboard
     */
    public function getRecentActivity(): JsonResponse
    {
        try {
            $filters = request()->only(['entity_type', 'action', 'user_id', 'date_from', 'date_to']);
            $limit = request()->get('limit', 20);

            $activity = $this->auditService->getRecentActivity($limit, $filters);

            // Convert Collection to array for JSON response
            return response()->json($activity->toArray());
        } catch (\Throwable $e) {
            \Log::error('Error fetching recent activity: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => auth()->id() ?? 'guest'
            ]);
            
            // Return empty array instead of 500 error to prevent UI breaking
            return response()->json([]);
        }
    }

    /**
     * Get audit history for a specific entity
     */
    public function getEntityAuditHistory(string $entityType, int $entityId): JsonResponse
    {
        $limit = request()->get('limit', 50);
        $history = $this->auditService->getEntityHistory($entityType, $entityId, $limit);
        
        return response()->json($history);
    }

    /**
     * Get audit statistics for reporting
     */
    public function getAuditStats(): JsonResponse
    {
        $filters = request()->only(['date_from', 'date_to', 'entity_type', 'user_id']);
        $stats = $this->auditService->getAuditStats($filters);
        
        return response()->json($stats);
    }

    /**
     * Get user activity summary
     */
    public function getUserActivitySummary(int $userId): JsonResponse
    {
        $filters = request()->only(['date_from', 'date_to']);
        $summary = $this->auditService->getUserActivitySummary($userId, $filters);
        
        return response()->json($summary);
    }

    /**
     * Export audit data
     */
    public function exportAuditData(): JsonResponse
    {
        $filters = request()->only(['entity_type', 'action', 'user_id', 'date_from', 'date_to']);
        $data = $this->auditService->exportAuditData($filters);
        
        return response()->json($data);
    }

    /**
     * Display the audit log page
     */
    public function auditLog(): Response
    {
        return Inertia::render('Admin/AuditLog', [
            'user' => auth()->user(),
            'permissions' => auth()->user()->getAllPermissions()->pluck('name')->toArray(),
        ]);
    }

    /**
     * Get navigation state and user permissions
     */
    public function getNavigationState(): JsonResponse
    {
        return response()->json([
            'activeSection' => request()->get('section', 'master-data'),
            'permissions' => auth()->user()->getAllPermissions()->pluck('name')->toArray(),
            'user' => auth()->user()->only(['id', 'name', 'email']),
        ]);
    }

    /**
     * Calculate master data statistics for all branches
     */
    private function getMasterDataStatistics(): array
    {
        $totalBeds = DB::table('beds')->count();
        $occupiedBeds = DB::table('beds')->where('status', 'occupied')->count();
        
        return [
            'departments' => DB::table('departments')->count(),
            'wards' => DB::table('wards')->count(),
            'beds' => $totalBeds,
            'tests' => DB::table('test_catalogs')->count(),
            'drugs' => DB::table('drug_formulary')->count(),
            'activeDepartments' => DB::table('departments')->where('status', 'active')->count(),
            'activeWards' => DB::table('wards')->where('status', 'active')->count(),
            'occupiedBeds' => $occupiedBeds,
            'availableBeds' => $totalBeds - $occupiedBeds,
            'activeTests' => DB::table('test_catalogs')->where('status', 'active')->count(),
            'activeDrugs' => DB::table('drug_formulary')->where('status', 'active')->count(),
            'bedOccupancyRate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0,
        ];
    }

    /**
     * Calculate master data statistics filtered by branch
     */
    private function getMasterDataStatsByBranch($branchId): array
    {
        $totalBeds = Bed::where('branch_id', $branchId)->count();
        $occupiedBeds = Bed::where('branch_id', $branchId)->where('status', 'occupied')->count();
        
        return [
            'departments' => Department::where('branch_id', $branchId)->count(),
            'wards' => Ward::where('branch_id', $branchId)->count(),
            'beds' => $totalBeds,
            'tests' => TestCatalog::count(), // Tests are usually global
            'drugs' => DrugFormulary::count(), // Drugs are usually global
            'activeDepartments' => Department::where('branch_id', $branchId)->where('status', 'active')->count(),
            'activeWards' => Ward::where('branch_id', $branchId)->where('status', 'active')->count(),
            'occupiedBeds' => $occupiedBeds,
            'availableBeds' => $totalBeds - $occupiedBeds,
            'activeTests' => TestCatalog::where('status', 'active')->count(),
            'activeDrugs' => DrugFormulary::where('status', 'active')->count(),
            'bedOccupancyRate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0,
        ];
    }

    /**
     * Get recent activity data for dashboard feed
     */
    private function getRecentActivityData(): array
    {
        $recentAudits = MasterDataAudit::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($audit) {
                return [
                    'id' => $audit->id,
                    'entity_type' => $audit->entity_type,
                    'entity_id' => $audit->entity_id,
                    'action' => $audit->action,
                    'user_name' => $audit->user->name ?? 'System',
                    'created_at' => $audit->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $audit->created_at->diffForHumans(),
                    'description' => $this->formatAuditDescription($audit),
                ];
            });

        return $recentAudits->toArray();
    }

    /**
     * Calculate bed occupancy rate across all wards
     */
    private function calculateBedOccupancyRate(): float
    {
        $totalBeds = Bed::count();
        // Count occupied beds based on current bed assignments
        $occupiedBeds = DB::table('bed_assignments')
            ->whereNull('released_at')
            ->count();
        
        return $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0;
    }

    /**
     * Format audit log entry into human-readable description
     */
    private function formatAuditDescription(MasterDataAudit $audit): string
    {
        $entityName = $this->getEntityDisplayName($audit->entity_type);
        
        switch ($audit->action) {
            case 'created':
                return "Created new {$entityName}";
            case 'updated':
                return "Updated {$entityName}";
            case 'deleted':
                return "Deleted {$entityName}";
            case 'status_changed':
                return "Changed {$entityName} status";
            default:
                return "Modified {$entityName}";
        }
    }

    /**
     * Get display name for entity type
     */
    private function getEntityDisplayName(string $entityType): string
    {
        $displayNames = [
            'Department' => 'department',
            'Ward' => 'ward',
            'Bed' => 'bed',
            'TestCatalog' => 'test catalog',
            'DrugFormulary' => 'drug formulary',
        ];

        return $displayNames[$entityType] ?? strtolower($entityType);
    }

    /**
     * Get system statistics for dashboard
     */
    private function getSystemStats($branchId = null): array
    {
        // Get user statistics
        $usersQuery = \App\Models\User::query();
        if ($branchId) {
            $usersQuery->where('branch_id', $branchId);
        }
        $totalUsers = $usersQuery->count();
        
        $activeUsersQuery = \App\Models\User::where('last_login_at', '>=', now()->subDays(7));
        if ($branchId) {
            $activeUsersQuery->where('branch_id', $branchId);
        }
        $activeUsers = $activeUsersQuery->count();
        
        // Get patient statistics
        $totalPatients = 0;
        try {
            if (\Schema::hasTable('patients')) {
                $patientsQuery = \App\Models\Patient::query();
                if ($branchId) {
                    $patientsQuery->where('branch_id', $branchId);
                }
                $totalPatients = $patientsQuery->count();
            }
        } catch (\Exception $e) {
            // Table doesn't exist, keep default value
        }
        
        // Get appointment statistics (if appointments table exists)
        $todayAppointments = 0;
        try {
            if (\Schema::hasTable('appointments')) {
                $appointmentsQuery = DB::table('appointments')->whereDate('appointment_date', today());
                if ($branchId) {
                    $appointmentsQuery->where('branch_id', $branchId);
                }
                $todayAppointments = $appointmentsQuery->count();
            }
        } catch (\Exception $e) {
            // Table doesn't exist, keep default value
        }
        
        // Get billing statistics (if billing_accounts table exists)
        $pendingBills = 0;
        try {
            if (\Schema::hasTable('billing_accounts')) {
                $billsQuery = \DB::table('billing_accounts')->where('status', '!=', 'paid');
                if ($branchId) {
                    $billsQuery->where('branch_id', $branchId);
                }
                $pendingBills = $billsQuery->count();
            }
        } catch (\Exception $e) {
            // Table doesn't exist, keep default value
        }
        
        // Determine system health based on various factors
        $systemHealth = $this->calculateSystemHealth();
        
        return [
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'totalPatients' => $totalPatients,
            'todayAppointments' => $todayAppointments,
            'pendingBills' => $pendingBills,
            'systemHealth' => $systemHealth,
        ];
    }

    /**
     * Calculate system health status
     */
    private function calculateSystemHealth(): string
    {
        $healthScore = 100;
        
        // Check database connectivity
        try {
            \DB::connection()->getPdo();
        } catch (\Exception $e) {
            $healthScore -= 50;
        }
        
        // Check if critical tables exist
        $criticalTables = ['users', 'departments', 'wards'];
        foreach ($criticalTables as $table) {
            if (!\Schema::hasTable($table)) {
                $healthScore -= 10;
            }
        }
        
        // Check recent errors (if logs table exists)
        try {
            if (\Schema::hasTable('failed_jobs')) {
                $recentFailures = \DB::table('failed_jobs')
                    ->where('failed_at', '>=', now()->subHours(24))
                    ->count();
                
                if ($recentFailures > 10) {
                    $healthScore -= 20;
                } elseif ($recentFailures > 5) {
                    $healthScore -= 10;
                }
            }
        } catch (\Exception $e) {
            // Ignore if table doesn't exist
        }
        
        if ($healthScore >= 90) {
            return 'good';
        } elseif ($healthScore >= 70) {
            return 'warning';
        } else {
            return 'critical';
        }
    }

    /**
     * Get financial summary for dashboard
     */
    private function getFinancialSummary($today, $branchId = null): array
    {
        $thisMonth = \Carbon\Carbon::now()->startOfMonth();
        $lastMonth = \Carbon\Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = \Carbon\Carbon::now()->subMonth()->endOfMonth();

        // Today's financials
        $todayPaymentsQuery = DB::table('payments')->whereDate('created_at', $today);
        $todayAccountsQuery = DB::table('billing_accounts')->whereDate('created_at', $today);
        
        if ($branchId) {
            $todayPaymentsQuery->where('branch_id', $branchId);
            $todayAccountsQuery->where('branch_id', $branchId);
        }
        
        $todayRevenue = $todayPaymentsQuery->sum('amount');
        $todayPayments = $todayPaymentsQuery->count();
        $todayDiscounts = $todayAccountsQuery->sum('discount_amount');

        // This month's financials
        $monthPaymentsQuery = DB::table('payments')->whereDate('created_at', '>=', $thisMonth);
        $monthAccountsQuery = DB::table('billing_accounts')->whereDate('created_at', '>=', $thisMonth);
        
        if ($branchId) {
            $monthPaymentsQuery->where('branch_id', $branchId);
            $monthAccountsQuery->where('branch_id', $branchId);
        }
        
        $monthRevenue = $monthPaymentsQuery->sum('amount');
        $monthInvoices = $monthAccountsQuery->sum('total_amount');
        $monthDiscounts = $monthAccountsQuery->sum('discount_amount');
        $monthNet = $monthAccountsQuery->sum('net_amount');

        // Last month's financials for comparison
        $lastMonthQuery = DB::table('payments')
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd]);
        
        if ($branchId) {
            $lastMonthQuery->where('branch_id', $branchId);
        }
        
        $lastMonthRevenue = $lastMonthQuery->sum('amount');

        // Outstanding balances
        $outstandingQuery = DB::table('billing_accounts')
            ->where('status', '!=', 'closed');
        
        if ($branchId) {
            $outstandingQuery->where('branch_id', $branchId);
        }
        
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

    /**
     * Get branch performance metrics
     */
    private function getBranchPerformance(): array
    {
        $thisMonth = \Carbon\Carbon::now()->startOfMonth();

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
            })
            ->toArray();
    }

    /**
     * Get discount summary and compliance metrics
     */
    private function getDiscountSummary($today, $branchId = null): array
    {
        $thisMonth = \Carbon\Carbon::now()->startOfMonth();

        // Today's discounts
        $todayDiscounts = DB::table('billing_accounts')
            ->whereDate('created_at', $today)
            ->where('discount_amount', '>', 0);
        
        if ($branchId) {
            $todayDiscounts->where('branch_id', $branchId);
        }
        
        $todayTotal = (float) $todayDiscounts->sum('discount_amount');
        $todayCount = $todayDiscounts->count();

        // Month's discounts
        $monthDiscounts = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0);
        
        if ($branchId) {
            $monthDiscounts->where('branch_id', $branchId);
        }
        
        $monthTotal = (float) $monthDiscounts->sum('discount_amount');
        $monthCount = $monthDiscounts->count();

        // Discount by type
        $byTypeQuery = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0);
        
        if ($branchId) {
            $byTypeQuery->where('branch_id', $branchId);
        }
        
        $byType = $byTypeQuery
            ->select('discount_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(discount_amount) as total'))
            ->groupBy('discount_type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => ucfirst($item->discount_type),
                    'count' => (int) $item->count,
                    'total' => (float) $item->total
                ];
            })
            ->toArray();

        // Top approvers
        $topApproversQuery = DB::table('billing_accounts')
            ->join('users', 'billing_accounts.discount_approved_by', '=', 'users.id')
            ->whereDate('billing_accounts.created_at', '>=', $thisMonth)
            ->where('billing_accounts.discount_amount', '>', 0);
        
        if ($branchId) {
            $topApproversQuery->where('billing_accounts.branch_id', $branchId);
        }
        
        $topApprovers = $topApproversQuery
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
            })
            ->toArray();

        // Compliance
        $totalDiscountsQuery = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0);
        
        if ($branchId) {
            $totalDiscountsQuery->where('branch_id', $branchId);
        }
        
        $totalDiscounts = $totalDiscountsQuery->count();
        
        $approvedDiscountsQuery = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0)
            ->whereNotNull('discount_approved_by');
        
        if ($branchId) {
            $approvedDiscountsQuery->where('branch_id', $branchId);
        }
        
        $approvedDiscounts = $approvedDiscountsQuery->count();

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

    /**
     * Get payment analytics and cashier performance
     */
    private function getPaymentAnalytics($today, $branchId = null): array
    {
        $thisMonth = \Carbon\Carbon::now()->startOfMonth();

        // Payment methods breakdown
        $byMethodQuery = DB::table('payments')
            ->whereDate('created_at', '>=', $thisMonth);
        
        if ($branchId) {
            $byMethodQuery->where('branch_id', $branchId);
        }
        
        $byMethod = $byMethodQuery
            ->select('method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
            ->groupBy('method')
            ->get()
            ->map(function ($item) {
                return [
                    'method' => ucfirst(str_replace('_', ' ', $item->method)),
                    'count' => (int) $item->count,
                    'total' => (float) $item->total
                ];
            })
            ->toArray();

        // Today's payment summary
        $todayPaymentsQuery = DB::table('payments')->whereDate('created_at', $today);
        if ($branchId) {
            $todayPaymentsQuery->where('branch_id', $branchId);
        }
        $todayTotal = (float) $todayPaymentsQuery->sum('amount');
        $todayCount = $todayPaymentsQuery->count();

        // Month's payment summary
        $monthPaymentsQuery = DB::table('payments')->whereDate('created_at', '>=', $thisMonth);
        if ($branchId) {
            $monthPaymentsQuery->where('branch_id', $branchId);
        }
        $monthTotal = (float) $monthPaymentsQuery->sum('amount');
        $monthCount = $monthPaymentsQuery->count();

        // Cashier performance
        $cashierQuery = DB::table('payments')
            ->whereDate('created_at', '>=', $thisMonth);
        
        if ($branchId) {
            $cashierQuery->where('branch_id', $branchId);
        }
        
        $cashierPerformance = $cashierQuery
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
            })
            ->toArray();

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

    /**
     * Get list of active branches
     */
    private function getBranches(): array
    {
        try {
            if (!\Schema::hasTable('branches')) {
                return [];
            }
            
            return DB::table('branches')
                ->where('status', 'active')
                ->select('id', 'branch_name as name', 'branch_code as code', 'location')
                ->orderBy('branch_name')
                ->get()
                ->map(function ($branch) {
                    return [
                        'id' => $branch->id,
                        'name' => $branch->name,
                        'code' => $branch->code,
                        'location' => $branch->location
                    ];
                })
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

}
