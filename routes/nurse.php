<?php

use App\Http\Controllers\Nurse\DashboardController;
use App\Http\Controllers\Nurse\VitalsController;
use App\Http\Controllers\Nurse\MedicationsController;
use App\Http\Controllers\Nurse\AlertsController;
use App\Http\Controllers\Nurse\TasksController;
use App\Http\Controllers\Nurse\PatientController;
use App\Http\Controllers\Nurse\OrdersController;
use App\Http\Controllers\Nurse\HandoverController;
use App\Http\Controllers\Nurse\MessagesController;
use App\Http\Controllers\Nurse\OPDController;
use App\Http\Controllers\Nurse\WardController;
use App\Http\Controllers\Nurse\IntakeOutputController;
use App\Http\Controllers\Nurse\LabResultController;
use App\Http\Controllers\Nurse\DocumentationController;
use App\Http\Controllers\Nurse\ConsultsController;
use App\Http\Controllers\Nurse\NotesController;
use App\Http\Controllers\Nurse\SettingsController;
use App\Http\Controllers\Nurse\ResultsController;
use App\Http\Controllers\Nurse\SafetyAlertsController;
use App\Http\Controllers\Nurse\ProceduresController;

Route::prefix('nurse')->name('nurse.')->middleware('auth')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Universal Search
    Route::get('/search', function() {
        return inertia('Nurse/Search');
    })->name('search');

    // Facility Switcher
    Route::get('/facility', function() {
        return inertia('Nurse/Facility');
    })->name('facility');

    // My Patients
    Route::get('/patients', [PatientController::class, 'index'])->name('patients');
    Route::get('/patients/my', [PatientController::class, 'index'])->name('patients.my');
    Route::get('/patients/clinic', [PatientController::class, 'index'])->name('patients.clinic');
    Route::get('/patients/ward', [PatientController::class, 'index'])->name('patients.ward');
    Route::get('/patients/all', [PatientController::class, 'index'])->name('patients.all');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])
        ->name('patients.show');

    // Tasks & Rounds
    Route::get('/tasks', [TasksController::class, 'index'])->name('tasks');
    Route::get('/tasks/{task}', [TasksController::class, 'show'])->name('tasks.show');
    Route::post('/tasks/{task}/complete', [TasksController::class, 'complete'])->name('tasks.complete');

    // Medication Administration
    Route::get('/medications', [MedicationsController::class, 'index'])->name('medications');
    Route::get('/medications/{encounter}', [MedicationsController::class, 'show'])->name('medications.show');
    Route::post('/medications/{encounter}/administer', [MedicationsController::class, 'administer'])->name('medications.administer');

    // Triage & Vitals
    Route::get('/vitals', [VitalsController::class, 'index'])->name('vitals');
    Route::get('/vitals/{encounter}', [VitalsController::class, 'show'])->name('vitals.show');
    Route::post('/vitals/{encounter}', [VitalsController::class, 'store'])->name('vitals.store');

    // Orders
    Route::get('/orders', [OrdersController::class, 'index'])->name('orders');
    Route::get('/orders/labs', [OrdersController::class, 'labs'])->name('orders.labs');
    Route::get('/orders/imaging', [OrdersController::class, 'imaging'])->name('orders.imaging');
    Route::get('/orders/medications', [OrdersController::class, 'medications'])->name('orders.medications');
    Route::post('/orders/{order}/acknowledge', [OrdersController::class, 'acknowledge'])->name('orders.acknowledge');

    // Handover
    Route::get('/handover', [HandoverController::class, 'index'])->name('handover');
    Route::post('/handover', [HandoverController::class, 'store'])->name('handover.store');

    // Messages
    Route::get('/messages', [MessagesController::class, 'index'])->name('messages');
    Route::post('/messages', [MessagesController::class, 'store'])->name('messages.store');

    // Additional Features
    Route::get('/alerts', [AlertsController::class, 'index'])->name('alerts');
    Route::post('/alerts', [AlertsController::class, 'store'])->name('alerts.store');
    Route::get('/care-plans', [PatientController::class, 'carePlans'])->name('care-plans');
    Route::get('/assessments', [PatientController::class, 'assessments'])->name('assessments');
    Route::get('/notifications', function() { return inertia('Nurse/Notifications'); })->name('notifications');
    Route::get('/documents', function() { return inertia('Nurse/Documents'); })->name('documents');
    Route::get('/task-assignments', function() { return inertia('Nurse/TaskAssignments'); })->name('task-assignments');

    // Facility Switcher Routes
    Route::get('/facility/opd', function() { return inertia('Nurse/Facility/OPD'); })->name('facility.opd');
    Route::get('/facility/ipd', function() { return inertia('Nurse/Facility/IPD'); })->name('facility.ipd');
    Route::get('/facility/emergency', function() { return inertia('Nurse/Facility/Emergency'); })->name('facility.emergency');
    Route::get('/facility/icu', function() { return inertia('Nurse/Facility/ICU'); })->name('facility.icu');
    Route::get('/facility/maternity', function() { return inertia('Nurse/Facility/Maternity'); })->name('facility.maternity');

    // Communication Routes
    Route::get('/communication', function() { return inertia('Nurse/Communication'); })->name('communication');

    // Units Management
    Route::get('/units/{unit}', [WardController::class, 'showUnit'])->name('units.show');

    // Notes shortcut (redirects to documentation)
    Route::get('/notes', function() { return redirect()->route('nurse.documentation.index'); })->name('notes');

    // OPD Workflows
    Route::get('/opd', function() {
        return inertia('Nurse/OPD/Overview');
    })->name('opd');
    Route::prefix('opd')->name('opd.')->group(function () {
        Route::get('/appointments', [OPDController::class, 'appointments'])->name('appointments');
        Route::post('/appointments/{appointment}/check-in', [OPDController::class, 'checkIn'])->name('check-in');
        Route::get('/triage', [OPDController::class, 'triageQueue'])->name('triage');
        Route::get('/walk-ins', [OPDController::class, 'walkIns'])->name('walk-ins');
        Route::post('/walk-ins', [OPDController::class, 'registerWalkIn'])->name('walk-ins.register');
        Route::get('/consultations', [OPDController::class, 'consultations'])->name('consultations');
        Route::get('/procedures', [OPDController::class, 'procedures'])->name('procedures');
        Route::get('/prescriptions', [OPDController::class, 'prescriptions'])->name('prescriptions');
        Route::get('/orders', [OPDController::class, 'diagnostics'])->name('orders');
    });

    // IPD/Ward Management
    Route::get('/ipd', function() {
        return inertia('Nurse/IPD/Overview');
    })->name('ipd');
    Route::prefix('ipd')->name('ipd.')->group(function () {
        Route::get('/census', [WardController::class, 'census'])->name('census');
        Route::get('/beds', [WardController::class, 'bedAllocation'])->name('beds');
        Route::post('/beds/assign', [WardController::class, 'assignBed'])->name('beds.assign');
        Route::post('/beds/{bed}/release', [WardController::class, 'releaseBed'])->name('beds.release');
        Route::get('/admissions', [WardController::class, 'admissions'])->name('admissions');
        Route::get('/transfers', [WardController::class, 'transfers'])->name('transfers');
        Route::get('/discharges', [WardController::class, 'discharges'])->name('discharges');
        Route::get('/intake-output', [IntakeOutputController::class, 'index'])->name('intake-output');
        Route::get('/intake-output/{encounter}', [IntakeOutputController::class, 'show'])->name('intake-output.show');
        Route::post('/intake-output/{encounter}', [IntakeOutputController::class, 'store'])->name('intake-output.store');
    });

    // Lab Results (Phase 3)
    Route::prefix('lab-results')->name('lab-results.')->group(function () {
        Route::get('/', [LabResultController::class, 'index'])->name('index');
        Route::get('/{order}/entry', [LabResultController::class, 'entry'])->name('entry');
        Route::post('/{order}/submit', [LabResultController::class, 'submit'])->name('submit');
        Route::get('/patient/{patient}/history', [LabResultController::class, 'history'])->name('history');
    });

    // Documentation (Phase 3)
    Route::prefix('documentation')->name('documentation.')->group(function () {
        Route::get('/', [DocumentationController::class, 'index'])->name('index');
        Route::post('/note', [DocumentationController::class, 'storeNote'])->name('note');
        Route::get('/incident', [DocumentationController::class, 'incident'])->name('incident');
        Route::post('/incident', [DocumentationController::class, 'storeIncident'])->name('incident.store');
    });

    // Notes (Phase 4)
    Route::prefix('notes')->name('notes.')->group(function () {
        Route::get('/progress', [NotesController::class, 'progress'])->name('progress');
        Route::get('/shift', [NotesController::class, 'shift'])->name('shift');
        Route::get('/opd', [NotesController::class, 'opd'])->name('opd');
        Route::get('/discharge', [NotesController::class, 'discharge'])->name('discharge');
        Route::post('/store', [NotesController::class, 'store'])->name('store');
    });

    // Consults (Phase 4)
    Route::prefix('consults')->name('consults.')->group(function () {
        Route::get('/', [ConsultsController::class, 'index'])->name('index');
        Route::post('/request', [ConsultsController::class, 'request'])->name('request');
    });

    // Safety Alerts (Phase 4)
    Route::prefix('alerts')->name('alerts.')->group(function () {
        Route::get('/', [SafetyAlertsController::class, 'index'])->name('index');
        Route::post('/{patient}/ews', [SafetyAlertsController::class, 'calculateEWS'])->name('ews');
        Route::post('/{patient}/fall-risk', [SafetyAlertsController::class, 'assessFallRisk'])->name('fall-risk');
        Route::post('/{alert}/acknowledge', [SafetyAlertsController::class, 'acknowledge'])->name('acknowledge');
    });

    // Procedures (Phase 4)
    Route::prefix('procedures')->name('procedures.')->group(function () {
        Route::get('/', [ProceduresController::class, 'index'])->name('index');
        Route::post('/{procedure}/complete', [ProceduresController::class, 'complete'])->name('complete');
    });

    // Results (Phase 4)
    Route::prefix('results')->name('results.')->group(function () {
        Route::get('/radiology', [ResultsController::class, 'radiology'])->name('radiology');
        Route::get('/trends', [ResultsController::class, 'trends'])->name('trends');
    });

    // Settings (Phase 4)
    Route::get('/settings', function() {
        return inertia('Nurse/Settings/Overview');
    })->name('settings');
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/profile', [SettingsController::class, 'profile'])->name('profile');
        Route::put('/profile', [SettingsController::class, 'updateProfile'])->name('profile.update');
        Route::get('/preferences', [SettingsController::class, 'preferences'])->name('preferences');
        Route::put('/preferences', [SettingsController::class, 'updatePreferences'])->name('preferences.update');
        Route::get('/notifications', [SettingsController::class, 'notifications'])->name('notifications');
    });
});
