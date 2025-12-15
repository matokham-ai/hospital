<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotesController extends Controller
{
    public function progress()
    {
        $notes = [
            [
                'id' => 1,
                'patient_name' => 'John Doe',
                'mrn' => 'MRN-2024-001',
                'content' => 'Patient stable, vitals within normal limits',
                'created_by' => 'Nurse Sarah',
                'created_at' => now()->subHours(2),
            ],
        ];

        return Inertia::render('Nurse/Notes/Progress', [
            'notes' => $notes,
        ]);
    }

    public function shift()
    {
        return Inertia::render('Nurse/Notes/Shift');
    }

    public function opd()
    {
        return Inertia::render('Nurse/Notes/OPD');
    }

    public function discharge()
    {
        return Inertia::render('Nurse/Notes/Discharge');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|integer',
            'note_type' => 'required|string',
            'content' => 'required|string',
        ]);

        return response()->json([
            'message' => 'Note saved successfully',
        ]);
    }
}
