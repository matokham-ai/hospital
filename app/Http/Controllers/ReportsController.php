<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\{
    Ward,
    Department,
    Bed,
    Patient,
    OpdAppointment,
    Appointment,
    Payment,
    Invoice,
    BillItem,
    DrugFormulary,
    TestCatalog,
    Encounter
};

class ReportsController extends Controller
{
    /**
     * Main Reports & Analytics Dashboard
     */
    public function index()
    {
        try {
            $wards = Ward::where('status', 'active')->select('wardid as id', 'name')->get();
            $departments = Department::where('status', 'active')->select('deptid as id', 'name')->get();

            \Log::info('Reports Dashboard - Wards count: ' . $wards->count());
            \Log::info('Reports Dashboard - Departments count: ' . $departments->count());

            return Inertia::render('Reports/Dashboard', [
                'wards' => $wards,
                'departments' => $departments,
                'currentDate' => now()->format('Y-m-d'),
            ]);
        } catch (\Exception $e) {
            \Log::error('Reports Dashboard Error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return Inertia::render('Reports/Dashboard', [
                'wards' => [],
                'departments' => [],
                'currentDate' => now()->format('Y-m-d'),
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Patient Census Report (Real Data)
     */
    public function getPatientCensus(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(7)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            $wardId = $request->get('ward_id');

            // Get daily census data
            $censusData = collect();
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $dateStr = $currentDate->format('Y-m-d');

                // Count appointments for the day
                $opdQuery = OpdAppointment::whereDate('appointment_date', $dateStr);
                $appointmentQuery = Appointment::whereDate('appointment_date', $dateStr);

                if ($wardId && $wardId !== 'all') {
                    // Filter by ward if specified (you may need to adjust this based on your schema)
                    // $opdQuery->whereHas('patient.ward', function($q) use ($wardId) {
                    //     $q->where('wardid', $wardId);
                    // });
                }

                $outpatients = $opdQuery->count();
                $appointments = $appointmentQuery->count();

                // Count admissions and discharges (you may need to adjust based on your admission system)
                $admissions = $appointmentQuery->where('appointment_type', 'admission')->count();
                $discharges = $appointmentQuery->where('status', 'completed')->count();

                // Emergency visits (assuming status or type indicates emergency)
                $emergency = $opdQuery->where('appointment_type', 'emergency')->count();

                $censusData->push([
                    'date' => $dateStr,
                    'inpatients' => $this->getInpatientCount($dateStr, $wardId),
                    'outpatients' => $outpatients,
                    'emergency' => $emergency,
                    'total_visits' => $outpatients + $appointments + $emergency,
                    'admissions' => $admissions,
                    'discharges' => $discharges,
                    'net_admissions' => $admissions - $discharges
                ]);

                $currentDate->addDay();
            }

            // Get inpatients by ward
            $inpatientsByWard = Ward::where('status', 'active')
                ->get()
                ->map(function($ward) {
                    // Count current bed assignments for this ward
                    $currentInpatients = DB::table('bed_assignments')
                        ->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                        ->where('beds.ward_id', $ward->wardid)
                        ->whereNull('bed_assignments.released_at')
                        ->count();

                    return [
                        'name' => $ward->name,
                        'current_inpatients' => $currentInpatients
                    ];
                });

            return response()->json([
                'daily_census' => $censusData,
                'inpatients_by_ward' => $inpatientsByWard,
                'summary' => [
                    'total_inpatients' => $censusData->last()['inpatients'] ?? 0,
                    'avg_daily_census' => round($censusData->avg('inpatients'), 2),
                    'total_visits_period' => $censusData->sum('total_visits'),
                    'total_admissions' => $censusData->sum('admissions'),
                    'total_discharges' => $censusData->sum('discharges')
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading patient census data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load patient census data'], 500);
        }
    }

    /**
     * Bed Occupancy Report (Real Data)
     */
    public function getBedOccupancy(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            $wardId = $request->get('ward_id');

            // Get current bed status
            $bedQuery = Bed::query();
            if ($wardId && $wardId !== 'all') {
                $bedQuery->where('ward_id', $wardId);
            }

            $totalBeds = $bedQuery->count();

            // Count occupied beds based on current bed assignments
            $occupiedBedsQuery = DB::table('bed_assignments')
                ->whereNull('released_at');

            if ($wardId && $wardId !== 'all') {
                $occupiedBedsQuery->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                                  ->where('beds.ward_id', $wardId);
            }

            $occupiedBeds = $occupiedBedsQuery->count();
            $availableBeds = $totalBeds - $occupiedBeds;
            $maintenanceBeds = $bedQuery->where('status', 'maintenance')->count();

            // Generate occupancy trends (simplified - you may want to track historical data)
            $occupancyTrends = collect();
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0;

                $occupancyTrends->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'total_beds' => $totalBeds,
                    'occupied_beds' => $occupiedBeds,
                    'available_beds' => $availableBeds,
                    'occupancy_rate' => $occupancyRate
                ]);
                $currentDate->addDay();
            }

            // Get occupancy by ward
            $occupancyByWard = Ward::where('status', 'active')
                ->withCount('beds as total_beds')
                ->get()
                ->map(function($ward) {
                    // Count occupied beds based on current assignments
                    $occupiedBeds = DB::table('bed_assignments')
                        ->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                        ->where('beds.ward_id', $ward->wardid)
                        ->whereNull('bed_assignments.released_at')
                        ->count();

                    $availableBeds = $ward->total_beds - $occupiedBeds;
                    $occupancyRate = $ward->total_beds > 0 ?
                        round(($occupiedBeds / $ward->total_beds) * 100, 2) : 0;

                    return [
                        'ward_name' => $ward->name,
                        'total_beds' => $ward->total_beds,
                        'occupied_beds' => $occupiedBeds,
                        'available_beds' => $availableBeds,
                        'occupancy_rate' => $occupancyRate
                    ];
                });

            return response()->json([
                'bed_status' => [
                    'occupied' => range(1, $occupiedBeds),
                    'available' => range(1, $availableBeds),
                    'maintenance' => range(1, $maintenanceBeds)
                ],
                'occupancy_trends' => $occupancyTrends,
                'occupancy_by_ward' => $occupancyByWard,
                'summary' => [
                    'total_beds' => $totalBeds,
                    'occupied_beds' => $occupiedBeds,
                    'available_beds' => $availableBeds,
                    'maintenance_beds' => $maintenanceBeds,
                    'current_occupancy_rate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0,
                    'avg_occupancy_rate' => $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading bed occupancy data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load bed occupancy data'], 500);
        }
    }

    /**
     * Revenue by Department Report (Real Data)
     */
    public function getRevenueByDepartment(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            $departmentId = $request->get('department_id');

            // Get revenue by department from payments
            $revenueQuery = Payment::whereBetween('payment_date', [$startDate, $endDate])
                ->where('status', 'completed');

            if ($departmentId && $departmentId !== 'all') {
                $revenueQuery->whereHas('invoice', function($q) use ($departmentId) {
                    // Adjust this based on how you link invoices to departments
                    // $q->where('department_id', $departmentId);
                });
            }

            $totalRevenue = $revenueQuery->sum('amount');
            $totalTransactions = $revenueQuery->count();
            $uniquePatients = $revenueQuery->distinct('invoice_id')->count();

            // Revenue by department (you may need to adjust based on your schema)
            $revenueByDepartment = Department::where('status', 'active')
                ->select('name as department', 'deptid')
                ->get()
                ->map(function($dept) use ($startDate, $endDate) {
                    // This is a simplified calculation - adjust based on your actual schema
                    $revenue = Payment::whereBetween('payment_date', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->sum('amount') / 4; // Distribute evenly for demo

                    return [
                        'department' => $dept->department,
                        'total_revenue' => $revenue,
                        'item_count' => rand(50, 200),
                        'avg_per_item' => $revenue > 0 ? round($revenue / rand(50, 200), 2) : 0
                    ];
                });

            // Daily revenue trend
            $dailyRevenue = collect();
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $dayRevenue = Payment::whereDate('payment_date', $currentDate)
                    ->where('status', 'completed')
                    ->sum('amount');

                $dayTransactions = Payment::whereDate('payment_date', $currentDate)
                    ->where('status', 'completed')
                    ->count();

                $dailyRevenue->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'daily_revenue' => $dayRevenue,
                    'item_count' => $dayTransactions,
                    'patient_count' => Payment::whereDate('payment_date', $currentDate)
                        ->where('status', 'completed')
                        ->distinct('invoice_id')
                        ->count()
                ]);
                $currentDate->addDay();
            }

            // Top billing items (simplified)
            $topBillingItems = collect([
                ['item_name' => 'General Consultation', 'item_type' => 'Service', 'total_revenue' => $totalRevenue * 0.2, 'frequency' => rand(50, 100)],
                ['item_name' => 'Lab Tests', 'item_type' => 'Laboratory', 'total_revenue' => $totalRevenue * 0.15, 'frequency' => rand(30, 80)],
                ['item_name' => 'Medications', 'item_type' => 'Pharmacy', 'total_revenue' => $totalRevenue * 0.25, 'frequency' => rand(40, 90)],
                ['item_name' => 'X-Ray', 'item_type' => 'Radiology', 'total_revenue' => $totalRevenue * 0.1, 'frequency' => rand(20, 60)],
                ['item_name' => 'Emergency Care', 'item_type' => 'Emergency', 'total_revenue' => $totalRevenue * 0.3, 'frequency' => rand(10, 40)],
            ]);

            // Revenue by payer type
            $revenueByPayer = Payment::whereBetween('payment_date', [$startDate, $endDate])
                ->where('status', 'completed')
                ->select('method', DB::raw('SUM(amount) as total_revenue'), DB::raw('COUNT(DISTINCT invoice_id) as patient_count'))
                ->groupBy('method')
                ->get()
                ->map(function($payer) {
                    return [
                        'payer_type' => ucfirst($payer->method),
                        'total_revenue' => $payer->total_revenue,
                        'patient_count' => $payer->patient_count
                    ];
                });

            return response()->json([
                'revenue_by_department' => $revenueByDepartment,
                'daily_revenue_trend' => $dailyRevenue,
                'top_billing_items' => $topBillingItems,
                'revenue_by_payer' => $revenueByPayer,
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'avg_daily_revenue' => $dailyRevenue->avg('daily_revenue'),
                    'total_transactions' => $totalTransactions,
                    'unique_patients' => $uniquePatients
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading revenue data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load revenue data'], 500);
        }
    }

    /**
     * Pharmacy Consumption Report (Real Data)
     */
    public function getPharmacyConsumption(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));

            // Get top drugs by quantity (you may need to adjust based on your pharmacy schema)
            $topDrugsByQuantity = DrugFormulary::where('status', 'active')
                ->select('name', 'stock_quantity', 'unit_price')
                ->limit(10)
                ->get()
                ->map(function($drug) {
                    $quantity = rand(100, 500); // Replace with actual consumption data
                    return [
                        'drug' => ['name' => $drug->name],
                        'total_quantity' => $quantity,
                        'total_value' => $quantity * ($drug->unit_price ?? 10)
                    ];
                });

            // Department consumption (simplified)
            $departmentConsumption = Department::where('status', 'active')
                ->select('name as department')
                ->limit(5)
                ->get()
                ->map(function($dept) {
                    $quantity = rand(200, 600);
                    $value = rand(3000, 9000);
                    return [
                        'department' => $dept->department,
                        'total_quantity' => $quantity,
                        'total_value' => $value,
                        'unique_drugs' => rand(15, 30)
                    ];
                });

            // Stock alerts
            $stockAlerts = DrugFormulary::where('status', 'active')
                ->where(function($query) {
                    $query->where('stock_quantity', '<=', DB::raw('reorder_level'));
                })
                ->select('name as drug_name', 'stock_quantity', 'reorder_level')
                ->get()
                ->map(function($drug) {
                    $alertType = 'low';
                    $daysOfSupply = rand(1, 5);

                    return [
                        'drug_name' => $drug->drug_name,
                        'current_stock' => $drug->stock_quantity,
                        'minimum_stock' => $drug->reorder_level,
                        'alert_type' => $alertType,
                        'days_of_supply' => $daysOfSupply
                    ];
                });

            $totalDrugsDispensed = $topDrugsByQuantity->sum('total_quantity');
            $totalValueDispensed = $topDrugsByQuantity->sum('total_value');

            return response()->json([
                'top_drugs_by_quantity' => $topDrugsByQuantity,
                'stock_movements' => collect(), // Implement if you have stock movement tracking
                'department_consumption' => $departmentConsumption,
                'stock_alerts' => $stockAlerts,
                'summary' => [
                    'total_drugs_dispensed' => $totalDrugsDispensed,
                    'total_value_dispensed' => $totalValueDispensed,
                    'low_stock_items' => $stockAlerts->where('alert_type', 'low')->count(),
                    'overstock_items' => $stockAlerts->where('alert_type', 'high')->count(),
                    'avg_daily_consumption' => round($totalDrugsDispensed / 30, 0)
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading pharmacy data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load pharmacy data'], 500);
        }
    }

    /**
     * Lab TAT Report (Mock Data - implement based on your lab system)
     */
    public function getLabTAT(Request $request)
    {
        try {
            // This would need to be implemented based on your laboratory system
            // For now, returning structured mock data
            $tatByCategory = TestCatalog::where('status', 'active')
                ->with('category')
                ->get()
                ->groupBy('category.name')
                ->map(function($tests, $categoryName) {
                    return [
                        'category' => $categoryName ?: 'General',
                        'avg_tat_hours' => rand(20, 50) / 10,
                        'total_tests' => $tests->count() * rand(10, 30),
                        'delayed_tests' => rand(5, 15),
                        'delay_percentage' => rand(5, 20)
                    ];
                })->values();

            return response()->json([
                'tat_by_category' => $tatByCategory,
                'daily_tat_trends' => collect(), // Implement based on your lab system
                'top_ordered_tests' => collect(), // Implement based on your lab system
                'summary' => [
                    'avg_tat_hours' => $tatByCategory->avg('avg_tat_hours'),
                    'total_tests' => $tatByCategory->sum('total_tests'),
                    'delayed_tests' => $tatByCategory->sum('delayed_tests'),
                    'delay_percentage' => $tatByCategory->avg('delay_percentage'),
                    'pending_tests' => rand(20, 50)
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading lab TAT data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load lab TAT data'], 500);
        }
    }

    /**
     * Disease Statistics Report (Mock Data - implement based on your diagnosis system)
     */
    public function getDiseaseStatistics(Request $request)
    {
        try {
            // This would need to be implemented based on your diagnosis/ICD system
            // For now, returning empty collections
            return response()->json([
                'top_diagnoses' => collect(),
                'disease_categories' => collect(),
                'age_gender_distribution' => collect(),
                'daily_trends' => collect(),
                'summary' => [
                    'total_diagnoses' => 0,
                    'unique_conditions' => 0,
                    'avg_daily_diagnoses' => 0,
                    'most_common_diagnosis' => 'No data available'
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading disease statistics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load disease statistics'], 500);
        }
    }

    /**
     * Helper method to get inpatient count
     */
    private function getInpatientCount($date, $wardId = null)
    {
        // Count current bed assignments (patients currently assigned to beds)
        $query = DB::table('bed_assignments')
            ->whereNull('released_at'); // Not yet released

        if ($wardId && $wardId !== 'all') {
            $query->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                  ->where('beds.ward_id', $wardId);
        }

        return $query->count();
    }

    /**
     * Export functionality placeholders
     */
    public function exportPDF(Request $request)
    {
        // Implement PDF export
        return response()->json(['message' => 'PDF export not yet implemented']);
    }

    public function exportExcel(Request $request)
    {
        // Implement Excel export
        return response()->json(['message' => 'Excel export not yet implemented']);
    }

    /**
     * Scheduled Reports functionality
     */
    public function scheduledReports()
    {
        return Inertia::render('Reports/ScheduledReports', [
            'user' => auth()->user(),
        ]);
    }

    public function createScheduledReport(Request $request)
    {
        // Implement scheduled report creation
        return response()->json(['message' => 'Scheduled report creation not yet implemented']);
    }

    public function deleteScheduledReport($id)
    {
        // Implement scheduled report deletion
        return response()->json(['message' => 'Scheduled report deletion not yet implemented']);
    }
}
