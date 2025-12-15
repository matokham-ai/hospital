<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PatientController;
use App\Http\Controllers\API\EncounterController;
use App\Http\Controllers\API\AppointmentController;
use App\Http\Controllers\API\AppointmentSlotController;
use App\Http\Controllers\API\ClinicalNoteController;
use App\Http\Controllers\API\DiagnosisController;
use App\Http\Controllers\API\VitalSignController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\PhysicianController;
use App\Http\Controllers\API\OpdQueueController;
use App\Http\Controllers\API\WardController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\BedController;
use App\Http\Controllers\API\BedAssignmentController;
use App\Http\Controllers\API\PrescriptionController;
use App\Http\Controllers\API\DispensationController;
use App\Http\Controllers\API\LabOrderController;
use App\Http\Controllers\API\LabResultController;
use App\Http\Controllers\API\ImagingOrderController;
use App\Http\Controllers\API\ImagingReportController;
use App\Http\Controllers\API\InvoiceController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\BillItemController;
use App\Http\Controllers\API\TariffController;
use App\Http\Controllers\Inpatient\InpatientController;
use App\Http\Controllers\Api\TestCatalogController as ApiTestCatalogController;
// Health check route
Route::get('ping', function () {
    return response()->json(['message' => 'pong', 'timestamp' => now()]);
});

// Public auth routes
Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

// Public role routes (for login page)
Route::get('roles', [RoleController::class, 'index']);

// Session management routes (no auth required for check)
Route::get('session-check', function () {
    return response()->json(['authenticated' => auth()->check()]);
});

// Protected routes - using web auth since this is called from Inertia.js frontend
Route::middleware(['auth:web', 'web'])->name('api.')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    
    // Session refresh route
    Route::post('session-refresh', function (Request $request) {
        $request->session()->regenerate();
        return response()->json(['message' => 'Session refreshed']);
    })->name('session.refresh');
    
    // Keep-alive endpoint to prevent session expiration during long form fills
    Route::post('keep-alive', function (Request $request) {
        // Touch the session to keep it alive
        $request->session()->put('last_activity', now()->timestamp);
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->timestamp,
            'session_expires_at' => now()->timestamp + (config('session.lifetime') * 60)
        ]);
    })->name('keep-alive');
    
    // Custom appointment routes
    Route::get('appointments/doctor-events', [AppointmentController::class, 'doctorEvents'])->name('appointments.doctor-events');
    
    // Custom encounter routes
    Route::get('encounters/number/{encounterNumber}', [EncounterController::class, 'findByNumber'])->name('encounters.find-by-number');
    Route::get('encounters/debug/{id}', [EncounterController::class, 'debug'])->name('encounters.debug');

    Route::apiResources([
        'patients' => PatientController::class,
        'encounters' => EncounterController::class,
        'appointments' => AppointmentController::class,
        'appointment-slots' => AppointmentSlotController::class,
        'clinical-notes' => ClinicalNoteController::class,
        'diagnoses' => DiagnosisController::class,
        'vitals' => VitalSignController::class,
        'departments' => DepartmentController::class,
        'physicians' => PhysicianController::class,
        'opd-queue' => OpdQueueController::class,
        'wards' => WardController::class,
        'beds' => BedController::class,
        'bed-assignments' => BedAssignmentController::class,
        'prescriptions' => PrescriptionController::class,
        'dispensations' => DispensationController::class,
        'lab-orders' => LabOrderController::class,
        'lab-results' => LabResultController::class,
        'imaging-orders' => ImagingOrderController::class,
        'imaging-reports' => ImagingReportController::class,
        'invoices' => InvoiceController::class,
        'payments' => PaymentController::class,
        'bill-items' => BillItemController::class,
        'tariffs' => TariffController::class,
    ]);

    // Pharmacy specific routes
    Route::prefix('pharmacy')->name('pharmacy.')->group(function () {
        Route::post('prescriptions', [PrescriptionController::class, 'sendToPharmacy'])->name('prescriptions.send');
        Route::patch('prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense'])->name('prescriptions.dispense');
    });

    // 👇 Move this block INSIDE here
    Route::prefix('inpatient')->middleware(['role:Admin|Doctor'])->group(function () {
        Route::post('/admit-patient', [InpatientController::class, 'admitPatient'])->name('admit-patient');
        Route::post('/admissions', [InpatientController::class, 'admissions'])->name('admissions.store');
        Route::post('/discharge-patient', [InpatientController::class, 'dischargePatient'])->name('discharge-patient');
    });

    Route::prefix('test-catalogs')->name('api.test-catalogs.')->group(function () {
        Route::get('/', [ApiTestCatalogController::class, 'index'])->name('index');
        Route::post('/', [ApiTestCatalogController::class, 'store'])->name('store');
        Route::get('/{testCatalog}', [ApiTestCatalogController::class, 'show'])->name('show');
        Route::put('/{testCatalog}', [ApiTestCatalogController::class, 'update'])->name('update');
        Route::delete('/{testCatalog}', [ApiTestCatalogController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-update', [ApiTestCatalogController::class, 'bulkUpdate'])->name('bulk-update');
        Route::post('/bulk-update-prices', [ApiTestCatalogController::class, 'bulkUpdatePrices'])->name('bulk-update-prices');
        Route::get('/categories/list', [ApiTestCatalogController::class, 'getCategories'])->name('categories');
        Route::patch('/{testCatalog}/turnaround-time', [ApiTestCatalogController::class, 'updateTurnaroundTime'])->name('update-turnaround-time');
        Route::get('/statistics/data', [ApiTestCatalogController::class, 'getStatistics'])->name('statistics');
        Route::get('/search/advanced', [ApiTestCatalogController::class, 'search'])->name('search');
        Route::get('/options/list', [ApiTestCatalogController::class, 'options'])->name('options');
        Route::post('/import/csv', [ApiTestCatalogController::class, 'import'])->name('import');
        Route::get('/export', [ApiTestCatalogController::class, 'export'])->name('export');
    });
    
    // OPD Appointment Prescription Management
    Route::prefix('opd/appointments')->name('api.opd.appointments.')->group(function () {
        Route::post('/{id}/prescriptions', [App\Http\Controllers\API\OpdPrescriptionController::class, 'store'])->name('prescriptions.store');
        Route::put('/{id}/prescriptions/{prescriptionId}', [App\Http\Controllers\API\OpdPrescriptionController::class, 'update'])->name('prescriptions.update');
        Route::delete('/{id}/prescriptions/{prescriptionId}', [App\Http\Controllers\API\OpdPrescriptionController::class, 'destroy'])->name('prescriptions.destroy');
        
        // Lab Order Management
        Route::post('/{id}/lab-orders', [App\Http\Controllers\API\OpdLabOrderController::class, 'store'])->name('lab-orders.store');
        Route::put('/{id}/lab-orders/{labOrderId}', [App\Http\Controllers\API\OpdLabOrderController::class, 'update'])->name('lab-orders.update');
        Route::delete('/{id}/lab-orders/{labOrderId}', [App\Http\Controllers\API\OpdLabOrderController::class, 'destroy'])->name('lab-orders.destroy');
        
        // Consultation Completion
        Route::get('/{id}/summary', [App\Http\Controllers\API\OpdConsultationController::class, 'summary'])->name('summary');
        Route::post('/{id}/complete', [App\Http\Controllers\API\OpdConsultationController::class, 'complete'])->name('complete');
    });

});

// Drug search endpoint - moved to controller for better optimization
// These need to be accessible with web auth for the frontend
Route::middleware('auth:web')->group(function () {
    Route::get('/drugs/search', [App\Http\Controllers\API\DrugFormularyController::class, 'search']);
    Route::get('/drugs/check-similar', [App\Http\Controllers\API\DrugFormularyController::class, 'checkSimilar']);
});

