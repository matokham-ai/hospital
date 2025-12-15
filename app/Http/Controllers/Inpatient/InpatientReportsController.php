<?php

namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReportExport;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Encounter;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\BedAssignment;

class InpatientReportsController extends Controller
{
    /**
     * Show the Inpatient Reports & Analytics dashboard
     */
    public function index()
    {
        return Inertia::render('Inpatient/Reports', [
            'wards' => DB::table('wards')->select('wardid as id', 'name')->where('status', 'active')->get(),
            'currentDate' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Get bed occupancy trends data
     */
    public function getBedOccupancyTrends(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $wardId = $request->get('ward_id');

        // Get daily occupancy data
        $occupancyData = collect();
        $currentDate = Carbon::parse($startDate);
        $endDateCarbon = Carbon::parse($endDate);

        while ($currentDate <= $endDateCarbon) {
            $dateStr = $currentDate->format('Y-m-d');
            
            // Get total beds for the date (considering ward filter)
            $totalBedsQuery = Bed::query();
            if ($wardId) {
                $totalBedsQuery->where('ward_id', $wardId);
            }
            $totalBeds = $totalBedsQuery->count();

            // Get occupied beds for the date
            $occupiedBedsQuery = BedAssignment::whereDate('assigned_at', '<=', $dateStr)
                ->where(function($q) use ($dateStr) {
                    $q->whereNull('released_at')
                      ->orWhereDate('released_at', '>', $dateStr);
                });
            
            if ($wardId) {
                $occupiedBedsQuery->whereHas('bed', function($q) use ($wardId) {
                    $q->where('ward_id', $wardId);
                });
            }
            
            $occupiedBeds = $occupiedBedsQuery->count();
            $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 2) : 0;

            $occupancyData->push([
                'date' => $dateStr,
                'total_beds' => $totalBeds,
                'occupied_beds' => $occupiedBeds,
                'available_beds' => $totalBeds - $occupiedBeds,
                'occupancy_rate' => $occupancyRate
            ]);

            $currentDate->addDay();
        }

        return response()->json([
            'data' => $occupancyData,
            'summary' => [
                'current_occupancy' => $occupancyData->last()['occupancy_rate'] ?? 0,
                'avg_occupancy' => round($occupancyData->avg('occupancy_rate'), 2),
                'total_beds' => $occupancyData->last()['total_beds'] ?? 0,
                'available_beds' => $occupancyData->last()['available_beds'] ?? 0,
            ]
        ]);
    }
 
   /**
     * Get Average Length of Stay (ALOS) data
     */
    public function getAverageStayLength(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $wardId = $request->get('ward_id');

        // Get completed encounters (discharged patients)
        $encountersQuery = Encounter::query()
            ->where('encounters.type', 'IPD')
            ->where('encounters.status', 'COMPLETED')
            ->whereNotNull('encounters.discharge_datetime')
            ->whereBetween('encounters.discharge_datetime', [$startDate, $endDate]);

        if ($wardId) {
            $encountersQuery->whereHas('bedAssignments.bed', function ($q) use ($wardId) {
                $q->where('beds.ward_id', $wardId);
            });
        }

        $encounters = $encountersQuery->get();


        // Calculate length of stay for each encounter (in fractional days)
        $stayLengths = $encounters->map(function ($encounter) {
            $admission = Carbon::parse($encounter->admission_datetime);
            $discharge = Carbon::parse($encounter->discharge_datetime);
            $hours = $admission->diffInHours($discharge);
            return round($hours / 24, 2); // e.g., 2.75 days
        });


        // Group by discharge date for trend analysis
        $dailyALOS = $encounters
            ->groupBy(function ($encounter) {
                return Carbon::parse($encounter->discharge_datetime)->format('Y-m-d');
            })
            ->map(function ($dayEncounters) {
                $dayStayLengths = $dayEncounters->map(function ($encounter) {
                    $admission = Carbon::parse($encounter->admission_datetime);
                    $discharge = Carbon::parse($encounter->discharge_datetime);
                    $hours = $admission->diffInHours($discharge);
                    return round($hours / 24, 2);
                });

                return [
                    'avg_stay_length' => round($dayStayLengths->avg(), 2),
                    'total_discharges' => $dayEncounters->count(),
                    'min_stay' => $dayStayLengths->min(),
                    'max_stay' => $dayStayLengths->max(),
                ];
            });

        return response()->json([
            'data' => $dailyALOS,
            'summary' => [
                'overall_alos' => round($stayLengths->avg(), 2),
                'median_stay' => $stayLengths->median(),
                'total_discharges' => $encounters->count(),
                'min_stay' => $stayLengths->min(),
                'max_stay' => $stayLengths->max()
            ]
        ]);
    }

    /**
     * Get Patient Flow Metrics (Admissions vs Discharges)
     */
    public function getPatientFlow(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $wardId = $request->get('ward_id');

        // Get daily admissions and discharges
        $flowData = collect();
        $currentDate = Carbon::parse($startDate);
        $endDateCarbon = Carbon::parse($endDate);

        while ($currentDate <= $endDateCarbon) {
            $dateStr = $currentDate->format('Y-m-d');
            
            // Admissions for the day
            $admissionsQuery = Encounter::where('type', 'IPD')
                ->whereDate('admission_datetime', $dateStr);
            
            if ($wardId) {
                $admissionsQuery->whereHas('bedAssignments.bed', function($q) use ($wardId) {
                    $q->where('ward_id', $wardId);
                });
            }
            
            $admissions = $admissionsQuery->count();

            // Discharges for the day
            $dischargesQuery = Encounter::where('type', 'IPD')
                ->whereDate('discharge_datetime', $dateStr);
            
            if ($wardId) {
                $dischargesQuery->whereHas('bedAssignments.bed', function($q) use ($wardId) {
                    $q->where('ward_id', $wardId);
                });
            }
            
            $discharges = $dischargesQuery->count();

            $flowData->push([
                'date' => $dateStr,
                'admissions' => $admissions,
                'discharges' => $discharges,
                'net_flow' => $admissions - $discharges
            ]);

            $currentDate->addDay();
        }

        return response()->json([
            'data' => $flowData,
            'summary' => [
                'total_admissions' => $flowData->sum('admissions'),
                'total_discharges' => $flowData->sum('discharges'),
                'net_flow' => $flowData->sum('net_flow'),
                'avg_daily_admissions' => round($flowData->avg('admissions'), 2),
                'avg_daily_discharges' => round($flowData->avg('discharges'), 2)
            ]
        ]);
    }    /**

     * Get Revenue Analysis data
     */
    public function getRevenueAnalysis(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $wardId = $request->get('ward_id');

        // Get revenue by service category
        $revenueByCategory = DB::table('billing_items')
            ->join('encounters', 'billing_items.encounter_id', '=', 'encounters.id')
            ->where('encounters.type', 'IPD')
            ->whereBetween('billing_items.created_at', [$startDate, $endDate])
            ->when($wardId, function($query) use ($wardId) {
                return $query->join('bed_assignments', 'encounters.id', '=', 'bed_assignments.encounter_id')
                            ->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                            ->where('beds.ward_id', $wardId);
            })
            ->select('billing_items.item_type', DB::raw('SUM(billing_items.amount) as total_revenue'), DB::raw('COUNT(*) as item_count'))
            ->groupBy('billing_items.item_type')
            ->get();

        // Get daily revenue trend
        $dailyRevenue = DB::table('billing_items')
            ->join('encounters', 'billing_items.encounter_id', '=', 'encounters.id')
            ->where('encounters.type', 'IPD')
            ->whereBetween('billing_items.created_at', [$startDate, $endDate])
            ->when($wardId, function($query) use ($wardId) {
                return $query->join('bed_assignments', 'encounters.id', '=', 'bed_assignments.encounter_id')
                            ->join('beds', 'bed_assignments.bed_id', '=', 'beds.id')
                            ->where('beds.ward_id', $wardId);
            })
            ->select(
                DB::raw('DATE(billing_items.created_at) as date'),
                DB::raw('SUM(billing_items.amount) as daily_revenue'),
                DB::raw('COUNT(DISTINCT billing_items.encounter_id) as patients_billed')
            )
            ->groupBy(DB::raw('DATE(billing_items.created_at)'))
            ->orderBy('date')
            ->get();

        // Calculate summary metrics
        $totalRevenue = $revenueByCategory->sum('total_revenue');
        $avgDailyRevenue = $dailyRevenue->avg('daily_revenue');

        return response()->json([
            'revenue_by_category' => $revenueByCategory,
            'daily_revenue' => $dailyRevenue,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'avg_daily_revenue' => round($avgDailyRevenue, 2),
                'total_items_billed' => $revenueByCategory->sum('item_count'),
                'patients_with_bills' => $dailyRevenue->sum('patients_billed')
            ]
        ]);
    }

    /**
     * Export reports to PDF
     */
    public function exportPDF(Request $request)
    {
        $reportType = $request->get('type', 'alos');
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        // Get your data (example for ALOS)
        $data = $this->getAlosData($startDate, $endDate);

        // Load a Blade view and render it to PDF
        $pdf = Pdf::loadView('exports.alos', [
            'data' => $data,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'reportType' => strtoupper($reportType),
        ])->setPaper('a4', 'landscape');

        // Save the file (optional)
        $filename = "report_{$reportType}_{$startDate}_to_{$endDate}.pdf";
        Storage::disk('public')->put("exports/{$filename}", $pdf->output());

        // Return a response for download
        return response()->download(storage_path("app/public/exports/{$filename}"));
    }

    /**
     * Export reports to Excel
     */
    public function exportExcel(Request $request)
    {
        $reportType = $request->get('type', 'alos');
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $data = $this->getAlosData($startDate, $endDate);

        return Excel::download(new ReportExport($data, $reportType, $startDate, $endDate), "report_{$reportType}.xlsx");
    }

    /**
     * Get ALOS data for export
     */
    private function getAlosData($startDate, $endDate)
    {
        // Get completed encounters (discharged patients)
        $encounters = Encounter::query()
            ->where('encounters.type', 'IPD')
            ->where('encounters.status', 'COMPLETED')
            ->whereNotNull('encounters.discharge_datetime')
            ->whereBetween('encounters.discharge_datetime', [$startDate, $endDate])
            ->get();

        // Calculate length of stay for each encounter
        return $encounters->map(function ($encounter) {
            $admission = Carbon::parse($encounter->admission_datetime);
            $discharge = Carbon::parse($encounter->discharge_datetime);
            $hours = $admission->diffInHours($discharge);
            $stayLength = round($hours / 24, 2);

            return [
                'patient_name' => $encounter->patient->name ?? 'N/A',
                'admission_date' => $admission->format('Y-m-d H:i'),
                'discharge_date' => $discharge->format('Y-m-d H:i'),
                'stay_length_days' => $stayLength,
                'encounter_id' => $encounter->id
            ];
        });
    }

}