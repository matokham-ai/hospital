<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SafetyAlertsController extends Controller
{
    public function index()
    {
        // Mock data - replace with actual database queries
        $alerts = [
            [
                'id' => 1,
                'patient_id' => 101,
                'patient_name' => 'John Doe',
                'mrn' => 'MRN-2024-001',
                'age' => 72,
                'location' => 'Ward A - Bed 12',
                'alert_type' => 'ews',
                'severity' => 'high',
                'score' => 7,
                'title' => 'Early Warning Score: 7',
                'description' => 'Elevated heart rate (110 bpm), low BP (90/60)',
                'triggered_at' => now()->subMinutes(15),
                'status' => 'active',
                'actions_taken' => null,
            ],
            [
                'id' => 2,
                'patient_id' => 102,
                'patient_name' => 'Jane Smith',
                'mrn' => 'MRN-2024-002',
                'age' => 85,
                'location' => 'Ward B - Bed 5',
                'alert_type' => 'fall_risk',
                'severity' => 'high',
                'score' => 8,
                'title' => 'High Fall Risk Score: 8/10',
                'description' => 'History of falls, confusion, mobility issues',
                'triggered_at' => now()->subHours(2),
                'status' => 'active',
                'actions_taken' => 'Bed alarm activated, frequent monitoring',
            ],
            [
                'id' => 3,
                'patient_id' => 103,
                'patient_name' => 'Robert Johnson',
                'mrn' => 'MRN-2024-003',
                'age' => 58,
                'location' => 'ICU - Bed 3',
                'alert_type' => 'sepsis',
                'severity' => 'critical',
                'score' => 4,
                'title' => 'Sepsis Screening: Positive (qSOFA 4)',
                'description' => 'Fever 39.2°C, tachycardia, hypotension, altered mental status',
                'triggered_at' => now()->subMinutes(5),
                'status' => 'active',
                'actions_taken' => 'Physician notified, blood cultures ordered',
            ],
        ];

        $statistics = [
            'active_alerts' => 12,
            'critical' => 3,
            'high' => 5,
            'medium' => 4,
            'ews_alerts' => 4,
            'fall_risk_alerts' => 5,
            'sepsis_alerts' => 3,
        ];

        return Inertia::render('Nurse/SafetyAlerts', [
            'alerts' => $alerts,
            'statistics' => $statistics,
        ]);
    }

    public function calculateEWS(Request $request, $patientId)
    {
        $validated = $request->validate([
            'respiratory_rate' => 'required|numeric',
            'oxygen_saturation' => 'required|numeric',
            'temperature' => 'required|numeric',
            'systolic_bp' => 'required|numeric',
            'heart_rate' => 'required|numeric',
            'consciousness' => 'required|string',
        ]);

        // Calculate EWS score (simplified)
        $score = 0;
        
        // Respiratory rate
        if ($validated['respiratory_rate'] <= 8 || $validated['respiratory_rate'] >= 25) $score += 3;
        elseif ($validated['respiratory_rate'] >= 21) $score += 2;
        elseif ($validated['respiratory_rate'] >= 9) $score += 0;
        
        // Oxygen saturation
        if ($validated['oxygen_saturation'] <= 91) $score += 3;
        elseif ($validated['oxygen_saturation'] <= 93) $score += 2;
        elseif ($validated['oxygen_saturation'] <= 95) $score += 1;
        
        // Temperature
        if ($validated['temperature'] <= 35.0) $score += 3;
        elseif ($validated['temperature'] >= 39.1) $score += 2;
        elseif ($validated['temperature'] >= 38.1) $score += 1;
        
        // Heart rate
        if ($validated['heart_rate'] <= 40 || $validated['heart_rate'] >= 131) $score += 3;
        elseif ($validated['heart_rate'] >= 111) $score += 2;
        elseif ($validated['heart_rate'] >= 91) $score += 1;
        
        // Consciousness
        if ($validated['consciousness'] !== 'alert') $score += 3;

        $severity = $score >= 7 ? 'critical' : ($score >= 5 ? 'high' : ($score >= 3 ? 'medium' : 'low'));

        return response()->json([
            'score' => $score,
            'severity' => $severity,
            'message' => 'EWS calculated successfully',
        ]);
    }

    public function assessFallRisk(Request $request, $patientId)
    {
        $validated = $request->validate([
            'history_of_falls' => 'required|boolean',
            'confusion' => 'required|boolean',
            'mobility_issues' => 'required|boolean',
            'medications' => 'required|boolean',
            'age_over_65' => 'required|boolean',
        ]);

        $score = 0;
        if ($validated['history_of_falls']) $score += 3;
        if ($validated['confusion']) $score += 2;
        if ($validated['mobility_issues']) $score += 2;
        if ($validated['medications']) $score += 1;
        if ($validated['age_over_65']) $score += 2;

        $risk = $score >= 7 ? 'high' : ($score >= 4 ? 'medium' : 'low');

        return response()->json([
            'score' => $score,
            'risk' => $risk,
            'message' => 'Fall risk assessed successfully',
        ]);
    }

    public function acknowledge(Request $request, $alertId)
    {
        $validated = $request->validate([
            'actions_taken' => 'required|string',
        ]);

        // Update alert status
        return response()->json([
            'message' => 'Alert acknowledged successfully',
        ]);
    }
}
