<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResultsController extends Controller
{
    public function radiology()
    {
        $reports = [
            [
                'id' => 1,
                'patient_name' => 'John Doe',
                'mrn' => 'MRN-2024-001',
                'exam_type' => 'Chest X-Ray',
                'status' => 'completed',
                'priority' => 'routine',
                'ordered_at' => now()->subDays(1),
                'completed_at' => now()->subHours(2),
                'findings' => 'No acute cardiopulmonary abnormality',
                'radiologist' => 'Dr. Brown',
            ],
            [
                'id' => 2,
                'patient_name' => 'Jane Smith',
                'mrn' => 'MRN-2024-002',
                'exam_type' => 'CT Abdomen',
                'status' => 'pending',
                'priority' => 'urgent',
                'ordered_at' => now()->subHours(3),
                'completed_at' => null,
                'findings' => null,
                'radiologist' => null,
            ],
        ];

        return Inertia::render('Nurse/Results/Radiology', [
            'reports' => $reports,
        ]);
    }

    public function trends()
    {
        return Inertia::render('Nurse/Results/Trends');
    }
}
