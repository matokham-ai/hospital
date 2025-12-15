<?php
use App\Http\Controllers\ICD10Controller;

Route::get('/icd10-codes', [ICD10Controller::class, 'index'])->name('icd10.index');
Route::get('/icd10-codes/{code}', [ICD10Controller::class, 'show']);

// Optional admin-only routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/icd10-codes', [ICD10Controller::class, 'store']);
    Route::put('/icd10-codes/{code}', [ICD10Controller::class, 'update']);
    Route::delete('/icd10-codes/{code}', [ICD10Controller::class, 'destroy']);
});
