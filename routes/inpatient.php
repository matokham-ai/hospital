<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Inpatient\{
    InpatientController,
    InpatientCarePlanController,
    LabDiagnosticsController,
    DoctorRoundsController,
    InpatientBillItemController,
    InpatientReportsController
};
use App\Http\Controllers\ServiceCatalogueController;
use App\Http\Controllers\BillingController;

// 🏥 Inpatient (IPD) — Inertia pages + sessioned actions (NOT /api)
Route::middleware(['auth', 'role:Admin|Doctor|Nurse'])->prefix('inpatient')->name('inpatient.')->group(function () {
    // Dashboards & pages - accessible to all authorized roles
    Route::get('/', [InpatientController::class, 'dashboard'])->name('dashboard');              // alias
    Route::get('/dashboard', [InpatientController::class, 'dashboard'])->name('dashboard.alias');
    Route::get('/admissions', [InpatientController::class, 'admissions'])->name('admissions');
    Route::get('/patients/{id?}', [InpatientController::class, 'patients'])->name('patients');
    Route::get('/medications', [InpatientController::class, 'medications'])->name('medications');

    // Prescriptions (IPD context) - Doctors can create, Nurses can view and administer
    Route::get('/admissions/{admissionId}/prescriptions', [InpatientController::class, 'prescriptions'])->name('prescriptions.index');

    // Only Doctors and Admins can create prescriptions
    Route::middleware(['role:Admin|Doctor'])->group(function () {
        Route::post('/admissions/{admissionId}/prescriptions', [InpatientController::class, 'storePrescription'])->name('prescriptions.store');
        Route::post('/prescriptions/{prescriptionId}/generate-schedule', [InpatientController::class, 'generateMedicationSchedule'])->name('prescriptions.generate-schedule');
    });

    // Nurses and Doctors can mark medications as given
    Route::post('/medications/{id}/mark-given', [InpatientController::class, 'markMedicationGiven'])->name('medications.mark-given');

    // Labs (IPD context)
    Route::get('/labs', [LabDiagnosticsController::class, 'index'])->name('labs');
    Route::post('/labs', [LabDiagnosticsController::class, 'store'])->name('labs.store');
    Route::get('/labs/{orderId}/results', [LabDiagnosticsController::class, 'getResults'])->name('labs.results');
    Route::patch('/labs/{orderId}/status', [LabDiagnosticsController::class, 'updateStatus'])->name('labs.updateStatus');
    Route::post('/labs/{orderId}/results', [LabDiagnosticsController::class, 'storeResults'])->name('labs.storeResults');
    Route::get('/labs/{orderId}/pdf', [LabDiagnosticsController::class, 'generatePdf'])->name('labs.pdf');
    Route::get('/labs/{orderId}/pdf/preview', [LabDiagnosticsController::class, 'previewPdf'])->name('labs.pdf.preview');

    // Only Admins can create new tests in the catalog
    Route::middleware(['role:Admin'])->group(function () {
        Route::post('/labs/test/new', [LabDiagnosticsController::class, 'storeNewTest'])->name('labs.storeNewTest');
    });

    // Doctor Rounds - All can view, Doctors can create/update
    Route::get('/rounds', [DoctorRoundsController::class, 'index'])->name('rounds');
    Route::get('/rounds/{roundId}', [DoctorRoundsController::class, 'show'])->name('rounds.show');
    Route::get('/rounds/{roundId}/notes', [DoctorRoundsController::class, 'getNotes'])->name('rounds.notes');

    // Only Doctors and Admins can create/modify rounds
    Route::middleware(['role:Admin|Doctor'])->group(function () {
        Route::post('/rounds', [DoctorRoundsController::class, 'store'])->name('rounds.store');
        Route::patch('/rounds/{roundId}/status', [DoctorRoundsController::class, 'updateStatus'])->name('rounds.updateStatus');
        Route::post('/rounds/{roundId}/notes', [DoctorRoundsController::class, 'addNote'])->name('rounds.addNote');
        Route::patch('/rounds/{roundId}', [DoctorRoundsController::class, 'updateRound'])->name('rounds.update');
    });

    // Care Plans - All can view, Nurses and Doctors can create/update
    Route::get('/care-plans', [InpatientCarePlanController::class, 'list'])->name('care-plans.list');
    Route::get('/care-plan/{id}', [InpatientCarePlanController::class, 'show'])->name('care-plan.show');
    Route::prefix('admissions/{admissionId}')->group(function () {
        Route::get('/care-plans', [InpatientCarePlanController::class, 'index'])->name('care-plan.index');
        Route::post('/care-plans', [InpatientCarePlanController::class, 'store'])->name('care-plan.store');
    });

    // Billing (IPD-scoped, non-API) - All can view, Admins can modify
    Route::get('/billing-charges', [InpatientBillItemController::class, 'charges'])->name('billing.charges');

    Route::prefix('billing')->name('billing.')->group(function () {
        Route::get('/encounters/{encounter}', [BillingController::class, 'show'])->name('show');
        Route::get('/services', [BillingController::class, 'getServices'])->name('services');

        // Only Admins can modify billing
        Route::middleware(['role:Admin'])->group(function () {
            Route::post('/encounters/{encounter}/items', [BillingController::class, 'addItem'])->name('add-item');
            Route::post('/encounters/{encounter}/multiple-items', [BillingController::class, 'addMultipleItems'])->name('add-multiple-items');
            Route::patch('/items/{billingItem}/discount', [BillingController::class, 'applyDiscount'])->name('apply-discount');
            Route::patch('/items/{billingItem}/cancel', [BillingController::class, 'cancelItem'])->name('cancel-item');
            Route::post('/accounts/{billingAccount}/payment', [BillingController::class, 'processPayment'])->name('process-payment');
            Route::patch('/accounts/{billingAccount}/close', [BillingController::class, 'closeBilling'])->name('close');
        });
    });

    // Only Admins can add billing charges
    Route::middleware(['role:Admin'])->group(function () {
        Route::post('/billing-charges/{billingAccount}/add', [InpatientBillItemController::class, 'addCharge'])->name('billing.add-charge');
    });

    // Service Catalogue - All can view, only Admins can modify
    Route::prefix('service-catalogue')->name('service-catalogue.')->group(function () {
        Route::get('/', [ServiceCatalogueController::class, 'index'])->name('index');

        // Code generation endpoints (available to all authenticated users)
        Route::post('/generate-code', [ServiceCatalogueController::class, 'generateCode'])->name('generate-code');
        Route::post('/generate-code-suggestions', [ServiceCatalogueController::class, 'generateCodeSuggestions'])->name('generate-code-suggestions');
        Route::post('/check-code-exists', [ServiceCatalogueController::class, 'checkCodeExists'])->name('check-code-exists');

        Route::middleware(['role:Admin'])->group(function () {
            Route::post('/', [ServiceCatalogueController::class, 'store'])->name('store');
            Route::patch('/{serviceCatalogue}', [ServiceCatalogueController::class, 'update'])->name('update');
            Route::delete('/{serviceCatalogue}', [ServiceCatalogueController::class, 'destroy'])->name('destroy');
        });
    });

    // Reports pages + exports (still non-API; API equivalents stay in routes/api.php)
    Route::get('/reports', [InpatientReportsController::class, 'index'])->name('reports');

    // API endpoints for inpatient functionality
    Route::prefix('api')->name('api.')->group(function () {
        // Read-only operations - accessible to all authorized roles
        Route::get('/search-patients', [InpatientController::class, 'searchPatients'])->name('search-patients');
        Route::get('/available-doctors', [InpatientController::class, 'getAvailableDoctors'])->name('available-doctors');
        Route::get('/bed-occupancy', [InpatientController::class, 'getBedOccupancyData'])->name('bed-occupancy');
        Route::get('/detailed-ward-summary', [InpatientController::class, 'getDetailedWardSummary'])->name('detailed-ward-summary');
        Route::get('/active-beds-with-patients', [InpatientController::class, 'getActiveBedsWithPatients'])->name('active-beds-with-patients');
        Route::get('/test-ward-queries', [InpatientController::class, 'testWardQueries'])->name('test-ward-queries');
        Route::get('/patient-details/{encounterId}', [InpatientController::class, 'getPatientDetails'])->name('patient-details');
        Route::get('/patient-profile/{encounterId}', [InpatientController::class, 'getPatientProfile'])->name('patient-profile');

        Route::get('/unassigned-patients', [InpatientController::class, 'getUnassignedPatients'])->name('unassigned-patients');
        Route::get('/ready-to-admit', [InpatientController::class, 'getReadyToAdmitPatients'])->name('ready-to-admit');
        Route::get('/patient-status/{name}', [InpatientController::class, 'getPatientStatus'])->name('patient-status');
        Route::get('/available-beds-list', [InpatientController::class, 'getAvailableBedsList'])->name('available-beds-list');
        Route::get('/test-patients', [InpatientController::class, 'testPatients'])->name('test-patients');
        Route::get('/search-formulary-drugs', [InpatientController::class, 'searchFormularyDrugs'])->name('search-formulary-drugs');

        // Billing API endpoints
        Route::get('/bill-items', [InpatientBillItemController::class, 'apiGetPatients'])->name('bill-items.index');
        Route::get('/bill-items/{billingAccountId}', [InpatientBillItemController::class, 'apiGetPatientDetails'])->name('bill-items.show');
        Route::post('/bill-items', [InpatientBillItemController::class, 'apiAddItem'])->name('bill-items.store');
        Route::put('/bill-items/{itemId}', [InpatientBillItemController::class, 'apiUpdateItem'])->name('bill-items.update');
        Route::delete('/bill-items/{itemId}', [InpatientBillItemController::class, 'apiDeleteItem'])->name('bill-items.destroy');

        // Bed management - Nurses and Doctors can manage bed assignments
        Route::post('/assign-bed', [InpatientController::class, 'assignBed'])->name('assign-bed');
        Route::post('/release-bed', [InpatientController::class, 'releaseBed'])->name('release-bed');
        Route::post('/transfer-patient/{encounterId}', [InpatientController::class, 'transferPatient'])->name('transfer-patient');

        // Critical operations - Only Doctors and Admins
        Route::middleware(['role:Admin|Doctor'])->group(function () {
            Route::post('/admit-patient', [InpatientController::class, 'admitPatient'])->name('admit-patient');
            Route::post('/discharge-patient', [InpatientController::class, 'dischargePatient'])->name('discharge-patient');
        });

        // Reports API endpoints - accessible to all authorized roles
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/bed-occupancy', [InpatientReportsController::class, 'getBedOccupancyTrends'])->name('bed-occupancy');
            Route::get('/average-stay', [InpatientReportsController::class, 'getAverageStayLength'])->name('average-stay');
            Route::get('/patient-flow', [InpatientReportsController::class, 'getPatientFlow'])->name('patient-flow');
            Route::get('/revenue-analysis', [InpatientReportsController::class, 'getRevenueAnalysis'])->name('revenue-analysis');
            Route::post('/export-pdf', [InpatientReportsController::class, 'exportPDF'])->name('export-pdf');
            Route::post('/export-excel', [InpatientReportsController::class, 'exportExcel'])->name('export-excel');
        });
    });
});
