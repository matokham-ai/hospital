<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function profile()
    {
        $user = auth()->user();
        
        return Inertia::render('Nurse/Settings/Profile', [
            'user' => $user,
        ]);
    }

    public function preferences()
    {
        return Inertia::render('Nurse/Settings/Preferences');
    }

    public function notifications()
    {
        return Inertia::render('Nurse/Settings/Notifications');
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
        ]);
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'theme' => 'required|in:light,dark,auto',
            'language' => 'required|string',
            'default_view' => 'required|string',
        ]);

        return response()->json([
            'message' => 'Preferences updated successfully',
        ]);
    }
}
