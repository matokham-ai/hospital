<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HandoverController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Placeholder for handover functionality
        return Inertia::render('Nurse/Handover/Index', [
            'userName' => $user->name,
            'handovers' => [],
            'message' => 'Handover module coming soon'
        ]);
    }

    public function store(Request $request)
    {
        // Placeholder for creating handover notes
        return back()->with('success', 'Handover note created');
    }
}
