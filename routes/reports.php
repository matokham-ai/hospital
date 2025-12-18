<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SimpleReportsController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Reports Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the HMS Reports & Analytics Dashboard
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Main Reports Dashboard (using real data)
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.dashboard');
    
    // Simple Dashboard (temporary for testing)
    Route::get('/reports/simple', function() {
        return Inertia::render('Reports/DashboardSimple', [
            'wards' => \App\Models\Ward::where('status', 'active')->select('wardid as id', 'name')->get(),
            'departments' => \App\Models\Department::where('status', 'active')->select('id', 'name')->get(),
            'currentDate' => now()->format('Y-m-d'),
        ]);
    })->name('reports.simple');
    
    // Legacy Report Pages (redirects to main dashboard)
    Route::get('/reports/financial', function() {
        return Inertia::render('Reports/Financial');
    })->name('reports.financial');
    
    Route::get('/reports/patients', function() {
        return Inertia::render('Reports/Patients');
    })->name('reports.patients');
    
    Route::get('/reports/departments', function() {
        return Inertia::render('Reports/Departments');
    })->name('reports.departments');
    
    // API Routes for Report Data
    Route::prefix('api/reports')->group(function () {
        
        // Patient Census Reports
        Route::get('/patient-census', [ReportsController::class, 'getPatientCensus']);
        
        // Bed Occupancy Reports
        Route::get('/bed-occupancy', [ReportsController::class, 'getBedOccupancy']);
        
        // Laboratory TAT Reports
        Route::get('/lab-tat', [ReportsController::class, 'getLabTAT']);
        
        // Pharmacy & Drug Consumption Reports
        Route::get('/pharmacy-consumption', [ReportsController::class, 'getPharmacyConsumption']);
        
        // Revenue by Department Reports
        Route::get('/revenue-department', [ReportsController::class, 'getRevenueByDepartment']);
        
        // Disease Statistics Reports
        Route::get('/disease-statistics', [ReportsController::class, 'getDiseaseStatistics']);
        
        // Export Routes
        Route::get('/export-pdf', [ReportsController::class, 'exportPDF']);
        Route::get('/export-excel', [ReportsController::class, 'exportExcel']);
    });
    
    // Scheduled Reports (Future Enhancement)
    Route::prefix('reports/scheduled')->group(function () {
        Route::get('/', [ReportsController::class, 'scheduledReports'])->name('reports.scheduled');
        Route::post('/create', [ReportsController::class, 'createScheduledReport'])->name('reports.scheduled.create');
        Route::delete('/{id}', [ReportsController::class, 'deleteScheduledReport'])->name('reports.scheduled.delete');
    });
});