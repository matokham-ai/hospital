<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\{Ward, Department};

class SimpleReportsController extends Controller
{
    /**
     * Main Reports & Analytics Dashboard
     */
    public function index()
    {
        return Inertia::render('Reports/Dashboard', [
            'wards' => Ward::where('status', 'active')->select('wardid as id', 'name')->get(),
            'departments' => Department::where('status', 'active')->select('deptid as id', 'name')->get(),
            'currentDate' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Test API endpoint
     */
    public function testApi()
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Reports API is working',
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Patient Census Report (Mock Data)
     */
    public function getPatientCensus(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(7)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));

            $censusData = collect();
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $censusData->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'inpatients' => rand(50, 100),
                    'outpatients' => rand(100, 200),
                    'emergency' => rand(10, 30),
                    'total_visits' => rand(160, 330),
                    'admissions' => rand(5, 15),
                    'discharges' => rand(5, 15),
                    'net_admissions' => rand(-5, 5)
                ]);
                $currentDate->addDay();
            }

            $inpatientsByWard = collect([
                ['name' => 'ICU', 'current_inpatients' => rand(10, 20)],
                ['name' => 'General Ward', 'current_inpatients' => rand(30, 50)],
                ['name' => 'Maternity', 'current_inpatients' => rand(15, 25)],
                ['name' => 'Pediatric', 'current_inpatients' => rand(10, 20)]
            ]);

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
            return response()->json(['error' => 'Failed to load patient census data'], 500);
        }
    }

    /**
     * Bed Occupancy Report (Mock Data)
     */
    public function getBedOccupancy(Request $request)
    {
        try {
            $occupancyTrends = collect();
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $totalBeds = 100;
                $occupiedBeds = rand(60, 90);
                $occupancyRate = round(($occupiedBeds / $totalBeds) * 100, 2);

                $occupancyTrends->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'total_beds' => $totalBeds,
                    'occupied_beds' => $occupiedBeds,
                    'available_beds' => $totalBeds - $occupiedBeds,
                    'occupancy_rate' => $occupancyRate
                ]);
                $currentDate->addDay();
            }

            $occupancyByWard = collect([
                ['ward_name' => 'ICU', 'total_beds' => 20, 'occupied_beds' => 18, 'available_beds' => 2, 'occupancy_rate' => 90],
                ['ward_name' => 'General', 'total_beds' => 50, 'occupied_beds' => 40, 'available_beds' => 10, 'occupancy_rate' => 80],
                ['ward_name' => 'Maternity', 'total_beds' => 20, 'occupied_beds' => 15, 'available_beds' => 5, 'occupancy_rate' => 75],
                ['ward_name' => 'Pediatric', 'total_beds' => 10, 'occupied_beds' => 8, 'available_beds' => 2, 'occupancy_rate' => 80]
            ]);

            return response()->json([
                'bed_status' => [
                    'occupied' => collect(range(1, 80)),
                    'available' => collect(range(1, 20)),
                    'maintenance' => collect(range(1, 5))
                ],
                'occupancy_trends' => $occupancyTrends,
                'occupancy_by_ward' => $occupancyByWard,
                'summary' => [
                    'total_beds' => 100,
                    'occupied_beds' => 80,
                    'available_beds' => 20,
                    'maintenance_beds' => 5,
                    'current_occupancy_rate' => 80,
                    'avg_occupancy_rate' => 78
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load bed occupancy data'], 500);
        }
    }

    /**
     * Lab TAT Report (Mock Data)
     */
    public function getLabTAT(Request $request)
    {
        try {
            $tatByCategory = collect([
                ['category' => 'Hematology', 'avg_tat_hours' => 2.5, 'total_tests' => 150, 'delayed_tests' => 10, 'delay_percentage' => 6.7],
                ['category' => 'Chemistry', 'avg_tat_hours' => 3.2, 'total_tests' => 200, 'delayed_tests' => 20, 'delay_percentage' => 10.0],
                ['category' => 'Microbiology', 'avg_tat_hours' => 24.5, 'total_tests' => 80, 'delayed_tests' => 15, 'delay_percentage' => 18.8],
                ['category' => 'Immunology', 'avg_tat_hours' => 4.1, 'total_tests' => 60, 'delayed_tests' => 5, 'delay_percentage' => 8.3]
            ]);

            $dailyTAT = collect();
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $dailyTAT->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'avg_tat_hours' => rand(20, 40) / 10,
                    'total_tests' => rand(40, 80),
                    'delayed_tests' => rand(2, 8)
                ]);
                $currentDate->addDay();
            }

            $topTests = collect([
                ['test_name' => 'Complete Blood Count', 'order_count' => 120, 'avg_tat_hours' => 2.1],
                ['test_name' => 'Basic Metabolic Panel', 'order_count' => 95, 'avg_tat_hours' => 2.8],
                ['test_name' => 'Lipid Panel', 'order_count' => 75, 'avg_tat_hours' => 3.2],
                ['test_name' => 'Thyroid Function', 'order_count' => 60, 'avg_tat_hours' => 4.5],
                ['test_name' => 'Liver Function', 'order_count' => 55, 'avg_tat_hours' => 3.1]
            ]);

            return response()->json([
                'tat_by_category' => $tatByCategory,
                'daily_tat_trends' => $dailyTAT,
                'top_ordered_tests' => $topTests,
                'summary' => [
                    'avg_tat_hours' => 3.2,
                    'total_tests' => 490,
                    'delayed_tests' => 50,
                    'delay_percentage' => 10.2,
                    'pending_tests' => 25
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load lab TAT data'], 500);
        }
    }

    /**
     * Pharmacy Consumption Report (Mock Data)
     */
    public function getPharmacyConsumption(Request $request)
    {
        try {
            $topDrugsByQuantity = collect([
                ['drug' => ['name' => 'Paracetamol'], 'total_quantity' => 500, 'total_value' => 2500],
                ['drug' => ['name' => 'Amoxicillin'], 'total_quantity' => 300, 'total_value' => 4500],
                ['drug' => ['name' => 'Ibuprofen'], 'total_quantity' => 250, 'total_value' => 3750],
                ['drug' => ['name' => 'Metformin'], 'total_quantity' => 200, 'total_value' => 6000]
            ]);

            $departmentConsumption = collect([
                ['department' => 'ICU', 'total_quantity' => 400, 'total_value' => 8000, 'unique_drugs' => 25],
                ['department' => 'General Ward', 'total_quantity' => 600, 'total_value' => 9000, 'unique_drugs' => 30],
                ['department' => 'Emergency', 'total_quantity' => 300, 'total_value' => 4500, 'unique_drugs' => 20],
                ['department' => 'OPD', 'total_quantity' => 200, 'total_value' => 3000, 'unique_drugs' => 15]
            ]);

            $stockAlerts = collect([
                ['drug_name' => 'Insulin', 'current_stock' => 5, 'minimum_stock' => 20, 'maximum_stock' => 100, 'alert_type' => 'low', 'days_of_supply' => 2],
                ['drug_name' => 'Aspirin', 'current_stock' => 150, 'minimum_stock' => 50, 'maximum_stock' => 100, 'alert_type' => 'high', 'days_of_supply' => 45]
            ]);

            return response()->json([
                'top_drugs_by_quantity' => $topDrugsByQuantity,
                'stock_movements' => collect(),
                'department_consumption' => $departmentConsumption,
                'stock_alerts' => $stockAlerts,
                'summary' => [
                    'total_drugs_dispensed' => 1250,
                    'total_value_dispensed' => 16750,
                    'low_stock_items' => 1,
                    'overstock_items' => 1,
                    'avg_daily_consumption' => 42
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load pharmacy data'], 500);
        }
    }

    /**
     * Revenue by Department Report (Mock Data)
     */
    public function getRevenueByDepartment(Request $request)
    {
        try {
            $revenueByDepartment = collect([
                ['department' => 'Cardiology', 'total_revenue' => 50000, 'item_count' => 120, 'avg_per_item' => 416.67],
                ['department' => 'Orthopedics', 'total_revenue' => 45000, 'item_count' => 90, 'avg_per_item' => 500.00],
                ['department' => 'Emergency', 'total_revenue' => 35000, 'item_count' => 200, 'avg_per_item' => 175.00],
                ['department' => 'General Medicine', 'total_revenue' => 30000, 'item_count' => 150, 'avg_per_item' => 200.00]
            ]);

            $dailyRevenue = collect();
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $dailyRevenue->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'daily_revenue' => rand(4000, 8000),
                    'item_count' => rand(15, 30),
                    'patient_count' => rand(10, 25)
                ]);
                $currentDate->addDay();
            }

            $topBillingItems = collect([
                ['item_name' => 'CT Scan', 'item_type' => 'Imaging', 'total_revenue' => 25000, 'frequency' => 50],
                ['item_name' => 'MRI', 'item_type' => 'Imaging', 'total_revenue' => 30000, 'frequency' => 30],
                ['item_name' => 'Surgery - Appendectomy', 'item_type' => 'Procedure', 'total_revenue' => 40000, 'frequency' => 20],
                ['item_name' => 'Consultation', 'item_type' => 'Service', 'total_revenue' => 15000, 'frequency' => 150]
            ]);

            $revenueByPayer = collect([
                ['payer_type' => 'Insurance', 'total_revenue' => 100000, 'patient_count' => 200],
                ['payer_type' => 'Cash', 'total_revenue' => 60000, 'patient_count' => 150],
                ['payer_type' => 'Government', 'total_revenue' => 40000, 'patient_count' => 100]
            ]);

            return response()->json([
                'revenue_by_department' => $revenueByDepartment,
                'daily_revenue_trend' => $dailyRevenue,
                'top_billing_items' => $topBillingItems,
                'revenue_by_payer' => $revenueByPayer,
                'summary' => [
                    'total_revenue' => 160000,
                    'avg_daily_revenue' => 5333,
                    'total_transactions' => 560,
                    'unique_patients' => 450
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load revenue data'], 500);
        }
    }

    /**
     * Disease Statistics Report (Mock Data)
     */
    public function getDiseaseStatistics(Request $request)
    {
        try {
            $topDiagnoses = collect([
                ['icd10_code' => 'J44.1', 'diagnosis_count' => 45, 'icd10Code' => ['description' => 'Chronic obstructive pulmonary disease with acute exacerbation']],
                ['icd10_code' => 'I10', 'diagnosis_count' => 38, 'icd10Code' => ['description' => 'Essential hypertension']],
                ['icd10_code' => 'E11.9', 'diagnosis_count' => 32, 'icd10Code' => ['description' => 'Type 2 diabetes mellitus without complications']],
                ['icd10_code' => 'J18.9', 'diagnosis_count' => 28, 'icd10Code' => ['description' => 'Pneumonia, unspecified organism']]
            ]);

            $diseaseCategories = collect([
                ['chapter' => 'Respiratory diseases', 'count' => 85, 'unique_patients' => 70],
                ['chapter' => 'Cardiovascular diseases', 'count' => 65, 'unique_patients' => 55],
                ['chapter' => 'Endocrine diseases', 'count' => 45, 'unique_patients' => 40],
                ['chapter' => 'Infectious diseases', 'count' => 35, 'unique_patients' => 30]
            ]);

            $ageGenderDistribution = collect([
                ['age_group' => 'Young Adult (20-39)', 'gender' => 'Male', 'count' => 25],
                ['age_group' => 'Young Adult (20-39)', 'gender' => 'Female', 'count' => 30],
                ['age_group' => 'Middle Age (40-59)', 'gender' => 'Male', 'count' => 40],
                ['age_group' => 'Middle Age (40-59)', 'gender' => 'Female', 'count' => 35],
                ['age_group' => 'Senior (60+)', 'gender' => 'Male', 'count' => 50],
                ['age_group' => 'Senior (60+)', 'gender' => 'Female', 'count' => 45]
            ]);

            $dailyTrends = collect();
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
            
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $dailyTrends->push([
                    'date' => $currentDate->format('Y-m-d'),
                    'diagnosis_count' => rand(8, 15),
                    'patient_count' => rand(6, 12)
                ]);
                $currentDate->addDay();
            }

            return response()->json([
                'top_diagnoses' => $topDiagnoses,
                'disease_categories' => $diseaseCategories,
                'age_gender_distribution' => $ageGenderDistribution,
                'daily_trends' => $dailyTrends,
                'summary' => [
                    'total_diagnoses' => 143,
                    'unique_conditions' => 4,
                    'avg_daily_diagnoses' => 11.5,
                    'most_common_diagnosis' => 'Chronic obstructive pulmonary disease with acute exacerbation'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load disease statistics'], 500);
        }
    }
}