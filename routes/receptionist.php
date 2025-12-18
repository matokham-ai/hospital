<?php
use App\Http\Controllers\Receptionist\DashboardController;

// Debug route to check user roles (remove in production)
Route::get('/debug/user-roles', function () {
    $user = auth()->user();
    if (!$user) {
        return response()->json(['message' => 'Not authenticated']);
    }
    
    return response()->json([
        'user' => $user->name,
        'email' => $user->email,
        'roles' => $user->getRoleNames(),
        'all_permissions' => $user->getAllPermissions()->pluck('name'),
    ]);
})->middleware('auth');

Route::prefix('receptionist')
    ->middleware(['auth'])
    ->name('receptionist.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');
    });
