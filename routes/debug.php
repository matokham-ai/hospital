<?php

use Illuminate\Support\Facades\Route;

// ⚠️ Debug/diagnostic routes — only in local / when APP_DEBUG=true
if (app()->hasDebugModeEnabled() || config('app.debug')) {

    // Inpatient live data peek
    Route::middleware('auth')->prefix('inpatient')->group(function () {
        Route::get('/api/debug-encounters', function () {
            return response()->json([
                'encounters' => \App\Models\Encounter::with('patient')->where('type', 'IPD')->where('status', 'ACTIVE')->get(),
                'bed_assignments' => \App\Models\BedAssignment::with('bed')->get(),
            ]);
        });
    });

    // OPD debug helpers
    Route::middleware('auth')->prefix('appointments')->group(function () {



    });
}
