<?php
// Quick script to assign receptionist role to a user
// Run with: php assign-receptionist-role.php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get user by email (change this to your email)
$userEmail = 'admin@hospital.com'; // Change this to your email
$user = \App\Models\User::where('email', $userEmail)->first();

if ($user) {
    $user->assignRole('Receptionist');
    echo "Receptionist role assigned to {$user->name} ({$user->email})\n";
} else {
    echo "User with email {$userEmail} not found\n";
    echo "Available users:\n";
    \App\Models\User::all()->each(function($u) {
        echo "- {$u->name} ({$u->email})\n";
    });
}