<?php

use App\Http\Controllers\EmergencyController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('emergency')->name('emergency.')->group(function () {
    Route::get('/', [EmergencyController::class, 'index'])->name('index'); // Default: Triage registration
    Route::get('/list', [EmergencyController::class, 'list'])->name('list'); // List of emergency patients
    Route::get('/create', [EmergencyController::class, 'create'])->name('create');
    Route::post('/', [EmergencyController::class, 'store'])->name('store');
    Route::get('/{id}', [EmergencyController::class, 'show'])->name('show');
    Route::get('/{id}/edit', [EmergencyController::class, 'edit'])->name('edit');
    Route::put('/{id}', [EmergencyController::class, 'update'])->name('update');
    Route::delete('/{id}', [EmergencyController::class, 'destroy'])->name('destroy');
    Route::post('/{id}/assign-doctor', [EmergencyController::class, 'assignDoctor'])->name('assign-doctor');
    Route::get('/{id}/triage', [EmergencyController::class, 'triage'])->name('triage');
    Route::post('/{id}/triage', [EmergencyController::class, 'storeTriage'])->name('triage.store');
    Route::post('/{id}/orders', [EmergencyController::class, 'storeOrder'])->name('orders.store');
    Route::post('/{id}/transfer', [EmergencyController::class, 'transfer'])->name('transfer');
});

// Doctor search endpoint for emergency module
Route::middleware('auth')->get('/doctors/search', function () {
    $doctors = \DB::table('physicians')
        ->select('physician_code as id', 'name', 'specialization')
        ->whereNotNull('physician_code')
        ->orderBy('name')
        ->get()
        ->map(function($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => null,
                'specialization' => $doctor->specialization,
            ];
        });
    
    return response()->json($doctors);
});
