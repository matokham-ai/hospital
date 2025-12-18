<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OpdController;

// 🩺 OPD (Outpatient) — Inertia pages + sessioned actions
Route::middleware('auth')->prefix('opd')->name('opd.')->group(function () {
    Route::get('/', [OpdController::class, 'index'])->name('index');
    Route::get('/dashboard', [OpdController::class, 'dashboard'])->name('dashboard');
    Route::get('/queue', [OpdController::class, 'queue'])->name('queue');
    Route::get('/consultations', [OpdController::class, 'consultations'])->name('consultations');
    Route::get('/prescriptions', [OpdController::class, 'prescriptions'])->name('prescriptions');

    // Session-auth “actions” (NOT /api)
    Route::post('/register-patient', [OpdController::class, 'registerPatient'])->name('register-patient');
    Route::post('/appointments/{id}/start-consultation', [OpdController::class, 'startConsultation'])->name('start-consultation');
    Route::post('/appointments/{id}/complete', [OpdController::class, 'completeConsultation'])->name('complete-consultation');
    Route::get('/consultations/{id}/soap', [OpdController::class, 'editSoapNotes'])->name('edit-soap');
    Route::post('/appointments/{id}/soap', [OpdController::class, 'saveSoapNotes'])->name('save-soap');
    Route::get('/consultations/{id}/notes', [OpdController::class, 'viewSoapNotes'])->name('view-soap');
    Route::post('/prescriptions/send-to-pharmacy', [OpdController::class, 'sendPrescriptionToPharmacy'])->name('send-prescription-pharmacy');
    Route::get('/dashboard-data', [OpdController::class, 'getDashboardData'])->name('dashboard-data');
    Route::post('/appointments/{id}/check-in', [OpdController::class, 'checkInAppointment'])->name('check-in');
});
