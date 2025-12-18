<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Patient\AppointmentController;

// 📅 Appointments — Inertia pages + sessioned actions
Route::middleware('auth')->prefix('appointments')->name('web.appointments.')->group(function () {
    Route::get('/', [AppointmentController::class, 'index'])->name('index');
    Route::get('/create', [AppointmentController::class, 'create'])->name('create');
    Route::get('/today', [AppointmentController::class, 'today'])->name('today');
    Route::get('/calendar', [AppointmentController::class, 'calendar'])->name('calendar');
    Route::post('/', [AppointmentController::class, 'store'])->name('store');

    // Calendar events for web UI
    Route::get('/calendar-events', [AppointmentController::class, 'calendarEvents'])->name('calendar.events');

    // Consultation flow (sessioned)
    Route::get('/{id}', [AppointmentController::class, 'show'])->name('show');
    Route::post('/{id}/start-consultation', [AppointmentController::class, 'startConsultation'])->name('start.consultation');
    Route::post('/{id}/complete-consultation', [AppointmentController::class, 'completeConsultation'])->name('complete.consultation');
    Route::post('/{id}/soap-notes', [AppointmentController::class, 'saveSOAPNotes'])->name('soap.notes');

    // Doctor events
    Route::get('/doctor/{id}/events', [AppointmentController::class, 'doctorEvents'])->name('doctor.events');

    // Real-time test page
    Route::get('/realtime-test', function () {
        return inertia('Test/RealtimeTest');
    })->name('realtime.test');

    // (Optional) keep debug actions out of here — moved to debug.php
});


