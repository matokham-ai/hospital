<?php

use Illuminate\Support\Facades\Route;

// 🏁 Root redirect
Route::get('/', fn () => redirect()->route('login'));



// 🧭 Authenticated core (dashboard + profile)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

    // Branch switching
    Route::post('/branch/switch', [\App\Http\Controllers\BranchController::class, 'switch'])->name('branch.switch');
    Route::get('/branches', [\App\Http\Controllers\BranchController::class, 'index'])->name('branches.index');





    // Layout test
    Route::get('/layout-test', function () {
        return inertia('LayoutTest', [
            'user' => auth()->user()
        ]);
    })->name('layout.test');
});

// 📦 Module route files (keep API in routes/api.php as requested)
require __DIR__.'/admin.php';
require __DIR__.'/inpatient.php';
require __DIR__.'/opd.php';
require __DIR__.'/patients.php';
require __DIR__.'/appointments.php';
require __DIR__.'/pharmacy.php';
require __DIR__.'/billing.php';
require __DIR__.'/reports.php';
require __DIR__.'/placeholders.php';
require __DIR__.'/debug.php';
require __DIR__.'/receptionist.php';
require __DIR__.'/doctor.php';
require __DIR__.'/nurse.php';
require __DIR__.'/icd10.php';
require __DIR__.'/emergency.php';
// Auth scaffolding
require __DIR__.'/auth.php';

// Route alias for role-based redirect compatibility
Route::middleware('auth')->get('/pharmacist/dashboard', function () {
    return redirect()->route('pharmacy.dashboard');
})->name('pharmacist.dashboard');

