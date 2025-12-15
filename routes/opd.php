<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OpdController;
use App\Http\Controllers\PrescriptionController;

// 🩺 OPD (Outpatient) — Inertia pages + sessioned actions
Route::middleware(['auth', 'verified'])->prefix('opd')->name('opd.')->group(function () {
    // --- Core OPD Pages ---
    Route::get('/', [OpdController::class, 'index'])->name('index');
    Route::get('/dashboard', [OpdController::class, 'dashboard'])->name('dashboard');
    Route::get('/queue', [OpdController::class, 'queue'])->name('queue');
    Route::get('/consultations', [OpdController::class, 'consultations'])->name('consultations');
    Route::get('/prescriptions', [OpdController::class, 'prescriptions'])->name('prescriptions');

    // --- Actions ---
    Route::post('/register-patient', [OpdController::class, 'registerPatient'])->name('register-patient');
    Route::post('/appointments/{id}/start-consultation', [OpdController::class, 'startConsultation'])->name('start-consultation');
    Route::post('/appointments/{id}/complete', [OpdController::class, 'completeConsultation'])->name('complete-consultation');
    Route::get('/consultations/{id}/soap', [OpdController::class, 'editSoapNotes'])->name('edit-soap');
    Route::get('/appointments/{id}/soap', [OpdController::class, 'editSoapNotes'])->name('appointments.soap'); // Alias for tests
    Route::post('/appointments/{id}/soap', [OpdController::class, 'saveSoapNotes'])->name('save-soap');
    Route::get('/consultations/{id}/notes', [OpdController::class, 'viewSoapNotes'])->name('view-soap');
    Route::post('/appointments/{id}/check-in', [OpdController::class, 'checkInAppointment'])->name('check-in');

    // --- Prescriptions ---
    // Use OpdController if you want prescription to tie directly to OPD workflow
    Route::post('/prescriptions/send-to-pharmacy', [OpdController::class, 'sendPrescriptionToPharmacy'])
        ->name('prescriptions.send-to-pharmacy');

    // OR: if you have a separate dedicated PrescriptionController for shared logic, use this instead:
    // Route::post('/prescriptions/send-to-pharmacy', [PrescriptionController::class, 'sendToPharmacy'])
    //     ->name('prescriptions.send-to-pharmacy');

    // --- Dashboard Data ---
    Route::get('/dashboard-data', [OpdController::class, 'getDashboardData'])->name('dashboard-data');

    // --- Triage ---
    Route::get('/triage', [\App\Http\Controllers\OpdTriageController::class, 'index'])->name('triage.index');
    Route::get('/triage/{id}', [\App\Http\Controllers\OpdTriageController::class, 'show'])->name('triage.show');
    Route::post('/triage/{id}', [\App\Http\Controllers\OpdTriageController::class, 'store'])->name('triage.store');
    Route::post('/triage/{id}/skip', [\App\Http\Controllers\OpdTriageController::class, 'skip'])->name('triage.skip');
});
