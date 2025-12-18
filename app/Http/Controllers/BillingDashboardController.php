<?php

namespace App\Http\Controllers;

use App\Models\BillingAccount;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BillingDashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();
        $branchId = $request->get('branch_id');

        return Inertia::render('Billing/Dashboard', [
            'kpis' => $this->getKPIs($today, $branchId),
            'revenueChart' => $this->getRevenueChart($branchId),
            'paymentMethods' => $this->getPaymentMethodsBreakdown($today, $branchId),
            'recentTransactions' => $this->getRecentTransactions($request, $branchId),
            'outstandingBills' => $this->getOutstandingBills($request, $branchId),
            'insuranceClaims' => $this->getInsuranceClaimsData($thisMonth, $branchId),
            'cashierActivity' => $this->getCashierActivity($today, $branchId),
            'departmentRevenue' => $this->getDepartmentRevenue($thisMonth, $branchId),
            'discountAnalytics' => $this->getDiscountAnalytics($today, $thisMonth, $branchId),
            'branchComparison' => $this->getBranchComparison($thisMonth),
            'branches' => $this->getBranches(),
            'selectedBranch' => $branchId,
        ]);
    }

    private function getKPIs($today, $branchId = null)
    {
        // Total Revenue Today
        $paymentsQuery = DB::table('payments')->whereDate('created_at', $today);
        if ($branchId) {
            $paymentsQuery->where('branch_id', $branchId);
        }
        $totalRevenueToday = $paymentsQuery->sum('amount');
        
        // Active Billing Accounts (Open status)
        $accountsQuery = BillingAccount::where('status', 'open');
        if ($branchId) {
            $accountsQuery->where('branch_id', $branchId);
        }
        $activeBillingAccounts = $accountsQuery->count();
        
        // Outstanding Balance
        $balanceQuery = BillingAccount::where('status', '!=', 'closed');
        if ($branchId) {
            $balanceQuery->where('branch_id', $branchId);
        }
        $outstandingBalance = $balanceQuery->sum('balance');
        
        // Invoices Generated Today
        $invoicesTodayQuery = BillingAccount::whereDate('created_at', $today);
        if ($branchId) {
            $invoicesTodayQuery->where('branch_id', $branchId);
        }
        $invoicesToday = $invoicesTodayQuery->count();
        $invoicesValueToday = $invoicesTodayQuery->sum('total_amount');
        
        // Deposits Collected Today
        $depositsQuery = DB::table('deposits')->whereDate('created_at', $today);
        if ($branchId) {
            $depositsQuery->where('branch_id', $branchId);
        }
        $depositsToday = $depositsQuery->sum('amount');
        
        // Insurance Claims This Month
        $thisMonth = Carbon::now()->startOfMonth();
        $insuranceClaimsCount = DB::table('insurance_claims')->whereDate('created_at', '>=', $thisMonth)->count();
        $insuranceClaimsValue = DB::table('insurance_claims')->whereDate('created_at', '>=', $thisMonth)->sum('claim_amount');
        
        // Profit/Income Summary from Ledger
        $profitSummary = DB::table('ledger_entries')->whereDate('created_at', '>=', $thisMonth)
            ->selectRaw('SUM(credit) - SUM(debit) as net_income')
            ->first();

        return [
            'totalRevenueToday' => [
                'value' => $totalRevenueToday,
                'label' => 'Total Revenue (Today)',
                'format' => 'currency',
                'icon' => 'CurrencyDollarIcon',
                'color' => 'green'
            ],
            'activeBillingAccounts' => [
                'value' => $activeBillingAccounts,
                'label' => 'Active Billing Accounts',
                'format' => 'number',
                'icon' => 'DocumentTextIcon',
                'color' => 'blue'
            ],
            'outstandingBalance' => [
                'value' => $outstandingBalance,
                'label' => 'Outstanding Balance',
                'format' => 'currency',
                'icon' => 'ExclamationTriangleIcon',
                'color' => 'red'
            ],
            'invoicesToday' => [
                'value' => $invoicesToday,
                'label' => 'Invoices Generated (Today)',
                'subValue' => $invoicesValueToday,
                'format' => 'number',
                'subFormat' => 'currency',
                'icon' => 'ReceiptPercentIcon',
                'color' => 'purple'
            ],
            'depositsToday' => [
                'value' => $depositsToday,
                'label' => 'Deposits Collected (Today)',
                'format' => 'currency',
                'icon' => 'BanknotesIcon',
                'color' => 'indigo'
            ],
            'insuranceClaims' => [
                'value' => $insuranceClaimsCount,
                'label' => 'Insurance Claims (This Month)',
                'subValue' => $insuranceClaimsValue,
                'format' => 'number',
                'subFormat' => 'currency',
                'icon' => 'ShieldCheckIcon',
                'color' => 'teal'
            ],
            'profitSummary' => [
                'value' => $profitSummary->net_income ?? 0,
                'label' => 'Net Income (This Month)',
                'format' => 'currency',
                'icon' => 'TrendingUpIcon',
                'color' => $profitSummary->net_income >= 0 ? 'green' : 'red'
            ]
        ];
    }

    private function getRevenueChart($branchId = null)
    {
        $last30Days = collect();
        
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $paymentsQuery = DB::table('payments')->whereDate('created_at', $date);
            $depositsQuery = DB::table('deposits')->whereDate('created_at', $date);
            
            if ($branchId) {
                $paymentsQuery->where('branch_id', $branchId);
                $depositsQuery->where('branch_id', $branchId);
            }
            
            $revenue = $paymentsQuery->sum('amount');
            
            $last30Days->push([
                'date' => $date->format('M d'),
                'revenue' => (float) $revenue,
                'deposits' => (float) $depositsQuery->sum('amount'),
            ]);
        }

        return $last30Days;
    }

    private function getPaymentMethodsBreakdown($today, $branchId = null)
    {
        $query = DB::table('payments')
            ->whereDate('created_at', $today);
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        
        return $query->select('method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('method')
            ->get()
            ->map(function ($payment) {
                return [
                    'method' => ucfirst(str_replace('_', ' ', $payment->method)),
                    'total' => (float) $payment->total,
                    'count' => $payment->count,
                    'percentage' => 0 // Will be calculated on frontend
                ];
            });
    }

    private function getRecentTransactions(Request $request = null, $branchId = null)
    {
        $query = DB::table('payments')
            ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->join('patients', 'invoices.patient_id', '=', 'patients.id')
            ->select(
                'payments.id',
                'payments.amount',
                'payments.method',
                'payments.reference_no',
                'payments.received_by',
                'payments.created_at',
                'patients.id as patient_id',
                'invoices.id as invoice_id',
                DB::raw("CONCAT(patients.first_name, ' ', patients.last_name) as patient_name")
            )
            ->orderByDesc('payments.created_at');

        if ($branchId) {
            $query->where('payments.branch_id', $branchId);
        }

        $page = $request ? $request->get('transactions_page', 1) : 1;
        $paginated = $query->paginate(5, ['*'], 'transactions_page', $page);

        return [
            'data' => collect($paginated->items())->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'patient_id' => $payment->patient_id,
                    'invoice_id' => $payment->invoice_id,
                    'patient_name' => $payment->patient_name,
                    'amount' => (float) $payment->amount,
                    'method' => ucfirst(str_replace('_', ' ', $payment->method)),
                    'reference_no' => $payment->reference_no,
                    'received_by' => $payment->received_by,
                    'created_at' => $payment->created_at,
                ];
            }),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'from' => $paginated->firstItem(),
            'to' => $paginated->lastItem(),
        ];
    }

    private function getOutstandingBills(Request $request = null, $branchId = null)
    {
        $query = DB::table('billing_accounts')
            ->join('patients', 'billing_accounts.patient_id', '=', 'patients.id')
            ->select(
                'billing_accounts.id',
                'billing_accounts.account_no',
                'billing_accounts.total_amount',
                'billing_accounts.amount_paid',
                'billing_accounts.balance',
                'billing_accounts.created_at',
                'billing_accounts.patient_id',
                DB::raw("CONCAT(patients.first_name, ' ', patients.last_name) as patient_name")
            )
            ->where('billing_accounts.status', 'open')
            ->where('billing_accounts.balance', '>', 0)
            ->orderByDesc('billing_accounts.balance');

        if ($branchId) {
            $query->where('billing_accounts.branch_id', $branchId);
        }

        $page = $request ? $request->get('bills_page', 1) : 1;
        $paginated = $query->paginate(5, ['*'], 'bills_page', $page);

        return [
            'data' => collect($paginated->items())->map(function ($account) {
                return [
                    'id' => $account->id,
                    'account_no' => $account->account_no,
                    'patient_id' => $account->patient_id,
                    'patient_name' => $account->patient_name,
                    'total_amount' => (float) $account->total_amount,
                    'amount_paid' => (float) $account->amount_paid,
                    'balance' => (float) $account->balance,
                    'created_at' => $account->created_at,
                ];
            }),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'from' => $paginated->firstItem(),
            'to' => $paginated->lastItem(),
        ];
    }

    private function getInsuranceClaimsData($thisMonth, $branchId = null)
    {
        $query = DB::table('insurance_claims')
            ->join('billing_accounts', 'insurance_claims.billing_account_id', '=', 'billing_accounts.id')
            ->join('patients', 'billing_accounts.patient_id', '=', 'patients.id')
            ->select(
                'insurance_claims.*',
                DB::raw("CONCAT(patients.first_name, ' ', patients.last_name) as patient_name")
            )
            ->whereDate('insurance_claims.created_at', '>=', $thisMonth);
        
        if ($branchId) {
            $query->where('billing_accounts.branch_id', $branchId);
        }
        
        $claims = $query->get();

        $summary = [
            'total_claims' => $claims->count(),
            'total_value' => (float) $claims->sum('claim_amount'),
            'by_status' => $claims->groupBy('claim_status')->map(function ($group, $status) {
                return [
                    'status' => $status,
                    'count' => $group->count(),
                    'value' => (float) $group->sum('claim_amount')
                ];
            })->values(),
            'by_insurer' => $claims->groupBy('insurer_name')->map(function ($group, $insurer) {
                return [
                    'insurer' => $insurer,
                    'count' => $group->count(),
                    'value' => (float) $group->sum('claim_amount')
                ];
            })->values(),
            'recent_claims' => $claims->take(5)->map(function ($claim) {
                return [
                    'id' => $claim->id,
                    'claim_number' => $claim->claim_number,
                    'patient_name' => $claim->patient_name,
                    'insurer_name' => $claim->insurer_name,
                    'claim_amount' => (float) $claim->claim_amount,
                    'status' => $claim->claim_status,
                    'submitted_date' => $claim->submitted_date ? 
                        Carbon::parse($claim->submitted_date)->format('M d, Y') : null
                ];
            })
        ];

        return $summary;
    }

    private function getCashierActivity($today, $branchId = null)
    {
        $query = DB::table('payments')
            ->whereDate('created_at', $today);
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        
        return $query->select('received_by', DB::raw('COUNT(*) as transaction_count'), 
                    DB::raw('SUM(amount) as total_collected'),
                    DB::raw('MIN(created_at) as first_transaction'),
                    DB::raw('MAX(created_at) as last_transaction'))
            ->groupBy('received_by')
            ->orderByDesc(DB::raw('SUM(amount)'))
            ->get()
            ->map(function ($activity) {
                return [
                    'cashier_name' => $activity->received_by,
                    'transaction_count' => (int) $activity->transaction_count,
                    'total_collected' => (float) $activity->total_collected,
                    'avg_transaction' => (float) ($activity->total_collected / $activity->transaction_count),
                    'first_transaction' => $activity->first_transaction,
                    'last_transaction' => $activity->last_transaction,
                    'working_hours' => Carbon::parse($activity->first_transaction)->diffInHours(Carbon::parse($activity->last_transaction))
                ];
            });
    }

    private function getDepartmentRevenue($thisMonth, $branchId = null)
    {
        $query = DB::table('billing_items')
            ->whereDate('created_at', '>=', $thisMonth);
        
        if ($branchId) {
            $query->join('billing_accounts', 'billing_items.encounter_id', '=', 'billing_accounts.encounter_id')
                ->where('billing_accounts.branch_id', $branchId);
        }
        
        return $query->select('item_type', DB::raw('SUM(amount) as total_revenue'), 
                    DB::raw('COUNT(*) as item_count'))
            ->groupBy('item_type')
            ->get()
            ->map(function ($item) {
                return [
                    'department' => ucfirst(str_replace('_', ' ', $item->item_type)),
                    'revenue' => (float) $item->total_revenue,
                    'item_count' => $item->item_count,
                    'avg_per_item' => (float) ($item->total_revenue / $item->item_count)
                ];
            });
    }

    public function getQuickStats(Request $request)
    {
        $period = $request->get('period', 'today'); // today, week, month
        
        $startDate = match($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            default => Carbon::today()
        };

        return response()->json([
            'revenue' => DB::table('payments')->whereDate('created_at', '>=', $startDate)->sum('amount'),
            'transactions' => DB::table('payments')->whereDate('created_at', '>=', $startDate)->count(),
            'outstanding' => BillingAccount::where('status', 'open')->sum('balance'),
            'collections' => DB::table('deposits')->whereDate('created_at', '>=', $startDate)->sum('amount')
        ]);
    }

    private function getDiscountAnalytics($today, $thisMonth, $branchId = null)
    {
        // Today's discounts
        $todayQuery = DB::table('billing_accounts')->whereDate('created_at', $today);
        $monthQuery = DB::table('billing_accounts')->whereDate('created_at', '>=', $thisMonth);
        
        if ($branchId) {
            $todayQuery->where('branch_id', $branchId);
            $monthQuery->where('branch_id', $branchId);
        }
        
        $todayDiscounts = $todayQuery->sum('discount_amount');
        $todayRevenue = $todayQuery->sum('total_amount');
        
        $monthDiscounts = $monthQuery->sum('discount_amount');
        $monthRevenue = $monthQuery->sum('total_amount');
        
        // Discount by type
        $discountByType = DB::table('billing_accounts')
            ->whereDate('created_at', '>=', $thisMonth)
            ->where('discount_amount', '>', 0);
        
        if ($branchId) {
            $discountByType->where('branch_id', $branchId);
        }
        
        $discountByType = $discountByType
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
        
        // Top discount approvers
        $topApprovers = DB::table('billing_accounts')
            ->join('users', 'billing_accounts.discount_approved_by', '=', 'users.id')
            ->whereDate('billing_accounts.created_at', '>=', $thisMonth)
            ->where('billing_accounts.discount_amount', '>', 0);
        
        if ($branchId) {
            $topApprovers->where('billing_accounts.branch_id', $branchId);
        }
        
        $topApprovers = $topApprovers
            ->select('users.name', DB::raw('COUNT(*) as count'), DB::raw('SUM(billing_accounts.discount_amount) as total'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc(DB::raw('SUM(billing_accounts.discount_amount)'))
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'approver' => $item->name,
                    'count' => (int) $item->count,
                    'total' => (float) $item->total
                ];
            });
        
        // Discount trends (last 30 days)
        $discountTrends = collect();
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $query = DB::table('billing_accounts')->whereDate('created_at', $date);
            
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
            
            $discountTrends->push([
                'date' => $date->format('M d'),
                'discount' => (float) $query->sum('discount_amount'),
                'revenue' => (float) $query->sum('total_amount')
            ]);
        }
        
        return [
            'today' => [
                'discount_amount' => (float) $todayDiscounts,
                'revenue' => (float) $todayRevenue,
                'percentage' => $todayRevenue > 0 ? round(($todayDiscounts / $todayRevenue) * 100, 2) : 0
            ],
            'month' => [
                'discount_amount' => (float) $monthDiscounts,
                'revenue' => (float) $monthRevenue,
                'percentage' => $monthRevenue > 0 ? round(($monthDiscounts / $monthRevenue) * 100, 2) : 0
            ],
            'by_type' => $discountByType,
            'top_approvers' => $topApprovers,
            'trends' => $discountTrends
        ];
    }

    private function getBranchComparison($thisMonth)
    {
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
                DB::raw('COALESCE(SUM(payments.amount), 0) as revenue'),
                DB::raw('COALESCE(COUNT(DISTINCT payments.id), 0) as transactions'),
                DB::raw('COALESCE(SUM(billing_accounts.discount_amount), 0) as discounts'),
                DB::raw('COALESCE(SUM(billing_accounts.balance), 0) as outstanding')
            )
            ->where('branches.status', 'active')
            ->groupBy('branches.id', 'branches.branch_name', 'branches.branch_code')
            ->orderByDesc(DB::raw('COALESCE(SUM(payments.amount), 0)'))
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'branch_name' => $branch->branch_name,
                    'branch_code' => $branch->branch_code,
                    'revenue' => (float) $branch->revenue,
                    'transactions' => (int) $branch->transactions,
                    'discounts' => (float) $branch->discounts,
                    'outstanding' => (float) $branch->outstanding,
                    'avg_transaction' => $branch->transactions > 0 ? 
                        round($branch->revenue / $branch->transactions, 2) : 0
                ];
            });
    }

    private function getBranches()
    {
        return DB::table('branches')
            ->where('status', 'active')
            ->select('id', 'branch_name', 'branch_code', 'location')
            ->orderBy('branch_name')
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->branch_name,
                    'code' => $branch->branch_code,
                    'location' => $branch->location
                ];
            });
    }
}