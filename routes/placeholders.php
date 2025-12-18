<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 🔧 Simple coming-soon pages (kept out of module files)
Route::middleware('auth')->group(function () {
    Route::get('/laboratory', function () {
        $user = auth()->user();
        return Inertia::render('ComingSoon', [
            'title' => 'Laboratory & Radiology',
            'description' => 'Manage lab orders, results, and radiology reports.',
            'icon' => '🔬',
            'userName' => $user?->name,
            'userEmail' => $user?->email,
            'userRole' => $user?->getRoleNames()->first(),
        ]);
    })->name('laboratory');

    Route::get('/settings', function () {
        $user = auth()->user();
        return Inertia::render('ComingSoon', [
            'title' => 'System Settings',
            'description' => 'Configure system settings, user management, and preferences.',
            'icon' => '⚙️',
            'userName' => $user?->name,
            'userEmail' => $user?->email,
            'userRole' => $user?->getRoleNames()->first(),
        ]);
    })->name('settings');
});
