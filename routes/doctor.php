<?php

use App\Http\Controllers\Doctor\DashboardController;

Route::prefix('doctor')->name('doctor.')->middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');
    
    // API routes for doctor components (using web auth instead of sanctum)
    Route::prefix('api')->group(function () {
        Route::get('/medical-records', [App\Http\Controllers\API\MedicalRecordsController::class, 'index']);
        Route::get('/medical-records/{id}', [App\Http\Controllers\API\MedicalRecordsController::class, 'show']);
        Route::get('/medical-records/debug/{id}', [App\Http\Controllers\API\MedicalRecordsController::class, 'debug']);
        Route::get('/debug/physician-data', function() {
            $encounter = App\Models\Encounter::with(['physician', 'department'])->where('encounter_number', 'ENC-1760893845')->first();
            $physicians = App\Models\Physician::take(3)->get(['physician_code', 'name']);
            $departments = App\Models\Department::take(3)->get(['deptid', 'name']);
            
            return response()->json([
                'encounter' => [
                    'id' => $encounter->id,
                    'encounter_number' => $encounter->encounter_number,
                    'attending_physician_id' => $encounter->attending_physician_id,
                    'department_id' => $encounter->department_id,
                ],
                'physician_relationship' => $encounter->physician ? [
                    'code' => $encounter->physician->physician_code,
                    'name' => $encounter->physician->name
                ] : null,
                'department_relationship' => $encounter->department ? [
                    'deptid' => $encounter->department->deptid,
                    'name' => $encounter->department->name
                ] : null,
                'sample_physicians' => $physicians->map(function($p) {
                    return ['code' => $p->physician_code, 'name' => $p->name];
                }),
                'sample_departments' => $departments->map(function($d) {
                    return ['deptid' => $d->deptid, 'name' => $d->name];
                })
            ]);
        });
        Route::get('/medicines', [App\Http\Controllers\Api\MedicineController::class, 'index']);
        Route::get('/medicines/{id}', [App\Http\Controllers\Api\MedicineController::class, 'show']);
    });
});
