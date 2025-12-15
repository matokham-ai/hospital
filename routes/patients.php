<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Patient\PatientController;

// 🧍 Patients — Inertia pages
Route::middleware(['auth'])->prefix('patients')->name('web.patients.')->group(function () {
    Route::get('/', [PatientController::class, 'index'])->name('index');
    
    // ✅ Only Admin, Doctor, Nurse, Receptionist can create patients
    Route::middleware(['role:Admin|Doctor|Nurse|Receptionist'])->group(function () {
        Route::get('/create', [PatientController::class, 'create'])->name('create');
        Route::post('/', [PatientController::class, 'store'])->name('store');
    });
    
    // ✅ Only Admin, Doctor, Nurse, Receptionist can edit/update patients
    Route::middleware(['role:Admin|Doctor|Nurse|Receptionist'])->group(function () {
        Route::get('/{id}/edit', [PatientController::class, 'edit'])->name('edit');
        Route::put('/{id}', [PatientController::class, 'update'])->name('update');
    });
    
    // ✅ Only Admin can delete patients
    Route::middleware(['role:Admin'])->group(function () {
        Route::delete('/{id}', [PatientController::class, 'destroy'])->name('destroy');
    });
    
    // ✅ Search patients API endpoint
    Route::get('/search', [PatientController::class, 'search'])->name('search');
    
    // ✅ All authenticated users can view patient details
    Route::get('/{id}', [\App\Http\Controllers\PatientProfileController::class, 'show'])->name('show');
    
    // ✅ Only Admin, Doctor, Nurse can export patient data
    Route::middleware(['role:Admin|Doctor|Nurse'])->group(function () {
        Route::get('/export/pdf', [PatientController::class, 'exportPdf'])->name('export.pdf');
        Route::get('/export/excel', [PatientController::class, 'exportExcel'])->name('export.excel');
    });
});
