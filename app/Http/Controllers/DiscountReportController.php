<?php

namespace App\Http\Controllers;

use App\Models\BillingAccount;
use App\Models\BillingItem;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DiscountReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $discountType = $request->get('discount_type');
        $approverId = $request->get('approver_id');

        return Inertia::render('Reports/DiscountReport', [
            'summary' => $this->getDiscountSummary($startDate, $endDate, $branchId),
            'detailedDiscounts' => $this->getDetailedDiscounts($request, $startDate, $endDate, $branchId, $discountType, $approverId),
            'discountByDepartment' => $this->getDiscountByDepartment($startDate, $endDate, $branchId),
            'discountByApprover' => $this->getDiscountByApprover($startDate, $endDate, $branchId),
            'discountTrends' => $this->getDiscountTrends($startDate, $endDate, $branchId),
            'complianceReport' => $this->getComplianceReport($startDate, $endDate, $branchId),
            'branches' => $this->getBranches(),
            'approvers' => $this->getApprovers(),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
                'discount_type' => $discountType,
                'approver_id' => $approverId
            ]
        ]);
    }

    private function getDiscountSummary($startDate, $endDate, $branchId = null)
    {
        $query = DB::table('billing_accounts')
            ->whereBetween('created_at', [$startDate, $endDate]);
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $totalRevenue = $query->sum('total_amount');
        $totalDiscount = $query->sum('discount_amount');
        $totalNet = $query->sum('net_amount');
        $discountCount = $query->where('discount_amount', '>', 0)->count();
        $totalAccounts = $query->count();

        // Average discount
        $avgDiscount = $discountCount > 0 ? $totalDiscount / $discountCount : 0;

        // Discount by type
        $byType = DB::table('billing_accounts')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('discount_amount', '>', 0);
        
        if ($branchId) {
            $byType->where('branch_id', $branchId);
        }

        $byType = $byType->select('discount_type', DB::raw('SUM(discount_amount) as total'))
            ->groupBy('discount_type')
            ->get();

        return [
            'total_revenue' => (float) $totalRevenue,
            'total_discount' => (float) $totalDiscount,
            'total_net' => (float) $totalNet,
            'discount_percentage' => $totalRevenue > 0 ? round(($totalDiscount / $totalRevenue) * 100, 2) : 0,
            'discount_count' => $discountCount,
            'total_accounts' => $totalAccounts,
            'accounts_with_discount_percentage' => $totalAccounts > 0 ? round(($discountCount / $totalAccounts) * 100, 2) : 0,
            'average_discount' => round($avgDiscount, 2),
            'by_type' => $byType->map(function ($item) {
                return [
                    'type' => ucfirst($item->discount_type),
                    'total' => (float) $item->total
                ];
            })
        ];
    }

    private function getDetailedDiscounts(Request $request, $startDate, $endDate, $branchId = null, $discountType = null, $approverId = null)
    {
        $query = DB::table('billing_accounts')
            ->leftJoin('patients', 'billing_accounts.patient_id', '=', 'patients.id')
            ->leftJoin('encounters', 'billing_accounts.encounter_id', '=', 'encounters.id')
            ->leftJoin('users', 'billing_accounts.discount_approved_by', '=', 'users.id')
            ->leftJoin('branches', 'billing_accounts.branch_id', '=', 'branches.id')
            ->whereBetween('billing_accounts.created_at', [$startDate, $endDate])
            ->where('billing_accounts.discount_amount', '>', 0)
            ->select(
                'billing_accounts.id',
                'billing_accounts.account_no',
                'billing_accounts.total_amount',
                'billing_accounts.discount_amount',
                'billing_accounts.discount_type',
                'billing_accounts.discount_percentage',
                'billing_accounts.discount_reason',
                'billing_accounts.net_amount',
                'billing_accounts.created_at',
                'billing_accounts.discount_approved_at',
                DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, '')) as patient_name"),
                'encounters.encounter_number',
                'users.name as approver_name',
                'branches.branch_name'
            );

        if ($branchId) {
            $query->where('billing_accounts.branch_id', $branchId);
        }

        if ($discountType) {
            $query->where('billing_accounts.discount_type', $discountType);
        }

        if ($approverId) {
            $query->where('billing_accounts.discount_approved_by', $approverId);
        }

        $query->orderByDesc('billing_accounts.discount_amount');

        $page = $request->get('page', 1);
        $paginated = $query->paginate(20, ['*'], 'page', $page);

        return [
            'data' => collect($paginated->items())->map(function ($item) {
                return [
                    'id' => $item->id,
                    'account_no' => $item->account_no,
                    'patient_name' => $item->patient_name ?: 'Unknown',
                    'encounter_number' => $item->encounter_number,
                    'branch_name' => $item->branch_name,
                    'total_amount' => (float) $item->total_amount,
                    'discount_amount' => (float) $item->discount_amount,
                    'discount_type' => ucfirst($item->discount_type),
                    'discount_percentage' => (float) $item->discount_percentage,
                    'discount_reason' => $item->discount_reason,
                    'net_amount' => (float) $item->net_amount,
                    'approver_name' => $item->approver_name,
                    'created_at' => $item->created_at,
                    'approved_at' => $item->discount_approved_at
                ];
            }),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total()
        ];
    }

    private function getDiscountByDepartment($startDate, $endDate, $branchId = null)
    {
        $query = DB::table('billing_items')
            ->join('billing_accounts', 'billing_items.encounter_id', '=', 'billing_accounts.encounter_id')
            ->whereBetween('billing_items.created_at', [$startDate, $endDate])
            ->where('billing_items.discount_amount', '>', 0);

        if ($branchId) {
            $query->where('billing_accounts.branch_id', $branchId);
        }

        return $query->select(
                'billing_items.item_type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(billing_items.discount_amount) as total_discount'),
                DB::raw('SUM(billing_items.amount) as total_amount')
            )
            ->groupBy('billing_items.item_type')
            ->orderByDesc(DB::raw('SUM(billing_items.discount_amount)'))
            ->get()
            ->map(function ($item) {
                return [
                    'department' => ucfirst(str_replace('_', ' ', $item->item_type)),
                    'count' => (int) $item->count,
                    'total_discount' => (float) $item->total_discount,
                    'total_amount' => (float) $item->total_amount,
                    'discount_percentage' => $item->total_amount > 0 ? 
                        round(($item->total_discount / $item->total_amount) * 100, 2) : 0
                ];
            });
    }

    private function getDiscountByApprover($startDate, $endDate, $branchId = null)
    {
        $query = DB::table('billing_accounts')
            ->join('users', 'billing_accounts.discount_approved_by', '=', 'users.id')
            ->whereBetween('billing_accounts.created_at', [$startDate, $endDate])
            ->where('billing_accounts.discount_amount', '>', 0);

        if ($branchId) {
            $query->where('billing_accounts.branch_id', $branchId);
        }

        return $query->select(
                'users.id',
                'users.name',
                'users.email',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(billing_accounts.discount_amount) as total_discount'),
                DB::raw('AVG(billing_accounts.discount_amount) as avg_discount'),
                DB::raw('MAX(billing_accounts.discount_amount) as max_discount')
            )
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc(DB::raw('SUM(billing_accounts.discount_amount)'))
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'email' => $item->email,
                    'count' => (int) $item->count,
                    'total_discount' => (float) $item->total_discount,
                    'avg_discount' => round($item->avg_discount, 2),
                    'max_discount' => (float) $item->max_discount
                ];
            });
    }

    private function getDiscountTrends($startDate, $endDate, $branchId = null)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $days = $start->diffInDays($end);

        $trends = collect();
        
        for ($i = 0; $i <= $days; $i++) {
            $date = $start->copy()->addDays($i);
            $query = DB::table('billing_accounts')
                ->whereDate('created_at', $date);
            
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $totalRevenue = $query->sum('total_amount');
            $totalDiscount = $query->sum('discount_amount');

            $trends->push([
                'date' => $date->format('M d'),
                'discount' => (float) $totalDiscount,
                'revenue' => (float) $totalRevenue,
                'percentage' => $totalRevenue > 0 ? round(($totalDiscount / $totalRevenue) * 100, 2) : 0
            ]);
        }

        return $trends;
    }

    private function getComplianceReport($startDate, $endDate, $branchId = null)
    {
        $query = DB::table('billing_accounts')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('discount_amount', '>', 0);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $totalDiscounts = $query->count();
        $approvedDiscounts = (clone $query)->whereNotNull('discount_approved_by')->count();
        $withReason = (clone $query)->whereNotNull('discount_reason')->count();
        $highValueDiscounts = (clone $query)->where('discount_amount', '>', 10000)->count();
        $highValueApproved = (clone $query)->where('discount_amount', '>', 10000)
            ->whereNotNull('discount_approved_by')->count();

        return [
            'total_discounts' => $totalDiscounts,
            'approved_discounts' => $approvedDiscounts,
            'approval_rate' => $totalDiscounts > 0 ? round(($approvedDiscounts / $totalDiscounts) * 100, 2) : 0,
            'with_reason' => $withReason,
            'reason_compliance' => $totalDiscounts > 0 ? round(($withReason / $totalDiscounts) * 100, 2) : 0,
            'high_value_discounts' => $highValueDiscounts,
            'high_value_approved' => $highValueApproved,
            'high_value_approval_rate' => $highValueDiscounts > 0 ? 
                round(($highValueApproved / $highValueDiscounts) * 100, 2) : 0
        ];
    }

    private function getBranches()
    {
        return DB::table('branches')
            ->where('status', 'active')
            ->select('id', 'branch_name', 'branch_code')
            ->orderBy('branch_name')
            ->get();
    }

    private function getApprovers()
    {
        return DB::table('users')
            ->whereIn('id', function($query) {
                $query->select('discount_approved_by')
                    ->from('billing_accounts')
                    ->whereNotNull('discount_approved_by')
                    ->distinct();
            })
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();
    }

    public function export(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');

        $data = DB::table('billing_accounts')
            ->leftJoin('patients', 'billing_accounts.patient_id', '=', 'patients.id')
            ->leftJoin('encounters', 'billing_accounts.encounter_id', '=', 'encounters.id')
            ->leftJoin('users', 'billing_accounts.discount_approved_by', '=', 'users.id')
            ->leftJoin('branches', 'billing_accounts.branch_id', '=', 'branches.id')
            ->whereBetween('billing_accounts.created_at', [$startDate, $endDate])
            ->where('billing_accounts.discount_amount', '>', 0);

        if ($branchId) {
            $data->where('billing_accounts.branch_id', $branchId);
        }

        $data = $data->select(
                'billing_accounts.account_no',
                DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, '')) as patient_name"),
                'encounters.encounter_number',
                'branches.branch_name',
                'billing_accounts.total_amount',
                'billing_accounts.discount_amount',
                'billing_accounts.discount_type',
                'billing_accounts.discount_percentage',
                'billing_accounts.discount_reason',
                'billing_accounts.net_amount',
                'users.name as approver_name',
                'billing_accounts.created_at',
                'billing_accounts.discount_approved_at'
            )
            ->orderByDesc('billing_accounts.discount_amount')
            ->get();

        // Generate CSV
        $csv = "Account No,Patient Name,Encounter,Branch,Total Amount,Discount Amount,Discount Type,Discount %,Reason,Net Amount,Approver,Created At,Approved At\n";
        
        foreach ($data as $row) {
            $csv .= implode(',', [
                $row->account_no,
                '"' . ($row->patient_name ?: 'Unknown') . '"',
                $row->encounter_number,
                '"' . ($row->branch_name ?: 'N/A') . '"',
                $row->total_amount,
                $row->discount_amount,
                $row->discount_type,
                $row->discount_percentage,
                '"' . ($row->discount_reason ?: '') . '"',
                $row->net_amount,
                '"' . ($row->approver_name ?: 'N/A') . '"',
                $row->created_at,
                $row->discount_approved_at ?: 'N/A'
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="discount_report_' . $startDate . '_to_' . $endDate . '.csv"');
    }
}
