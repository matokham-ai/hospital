<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MessagesController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Placeholder for messaging functionality
        return Inertia::render('Nurse/Messages/Index', [
            'userName' => $user->name,
            'messages' => [],
            'message' => 'Messages module coming soon'
        ]);
    }

    public function store(Request $request)
    {
        // Placeholder for sending messages
        return back()->with('success', 'Message sent');
    }
}
