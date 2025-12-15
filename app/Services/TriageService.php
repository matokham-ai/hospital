<?php

namespace App\Services;

class TriageService
{
    /**
     * Calculate triage score and level based on vitals and symptoms
     */
    public function calculateTriageScore(array $data): array
    {
        $score = 0;
        $redFlags = [];

        // Check vital signs
        $score += $this->scoreVitals($data, $redFlags);
        
        // Check pain level
        $score += $this->scorePain($data, $redFlags);
        
        // Check symptoms/red flags
        $score += $this->scoreSymptoms($data, $redFlags);

        // Determine triage level based on score
        $level = $this->determineTriageLevel($score, $redFlags);

        return [
            'triage_score' => $score,
            'triage_level' => $level,
            'red_flags' => !empty($redFlags) ? implode(', ', $redFlags) : null,
        ];
    }

    private function scoreVitals(array $data, array &$redFlags): int
    {
        $score = 0;

        // Temperature scoring
        if (isset($data['temperature'])) {
            $temp = (float) $data['temperature'];
            if ($temp >= 39.5 || $temp <= 35.0) {
                $score += 3;
                $redFlags[] = $temp >= 39.5 ? 'High fever' : 'Hypothermia';
            } elseif ($temp >= 38.5 || $temp <= 35.5) {
                $score += 2;
            }
        }

        // Blood Pressure scoring
        if (isset($data['blood_pressure'])) {
            $bp = $data['blood_pressure'];
            if (preg_match('/(\d+)\/(\d+)/', $bp, $matches)) {
                $systolic = (int) $matches[1];
                $diastolic = (int) $matches[2];
                
                if ($systolic >= 180 || $systolic < 90 || $diastolic >= 120 || $diastolic < 60) {
                    $score += 3;
                    $redFlags[] = $systolic >= 180 ? 'Hypertensive crisis' : 'Hypotension';
                } elseif ($systolic >= 160 || $systolic < 100) {
                    $score += 2;
                }
            }
        }

        // Heart Rate scoring
        if (isset($data['heart_rate'])) {
            $hr = (int) $data['heart_rate'];
            if ($hr >= 120 || $hr < 50) {
                $score += 3;
                $redFlags[] = $hr >= 120 ? 'Tachycardia' : 'Bradycardia';
            } elseif ($hr >= 100 || $hr < 60) {
                $score += 2;
            }
        }

        // Respiratory Rate scoring
        if (isset($data['respiratory_rate'])) {
            $rr = (int) $data['respiratory_rate'];
            if ($rr >= 30 || $rr < 10) {
                $score += 3;
                $redFlags[] = $rr >= 30 ? 'Tachypnea' : 'Bradypnea';
            } elseif ($rr >= 24 || $rr < 12) {
                $score += 2;
            }
        }

        // Oxygen Saturation scoring
        if (isset($data['oxygen_saturation'])) {
            $o2 = (int) $data['oxygen_saturation'];
            if ($o2 < 90) {
                $score += 4;
                $redFlags[] = 'Critical hypoxia';
            } elseif ($o2 < 94) {
                $score += 3;
                $redFlags[] = 'Hypoxia';
            } elseif ($o2 < 96) {
                $score += 1;
            }
        }

        return $score;
    }

    private function scorePain(array $data, array &$redFlags): int
    {
        if (!isset($data['pain_level'])) {
            return 0;
        }

        $pain = (int) $data['pain_level'];
        
        if ($pain >= 8) {
            $redFlags[] = 'Severe pain';
            return 3;
        } elseif ($pain >= 5) {
            return 2;
        } elseif ($pain >= 3) {
            return 1;
        }

        return 0;
    }

    private function scoreSymptoms(array $data, array &$redFlags): int
    {
        $score = 0;
        $chiefComplaint = strtolower($data['chief_complaint'] ?? '');
        $notes = strtolower($data['triage_notes'] ?? '');
        $combined = $chiefComplaint . ' ' . $notes;

        // Critical symptoms
        $criticalSymptoms = [
            'chest pain' => 4,
            'difficulty breathing' => 4,
            'stroke' => 4,
            'seizure' => 4,
            'unconscious' => 4,
            'severe bleeding' => 4,
            'head injury' => 3,
            'abdominal pain' => 2,
            'vomiting blood' => 4,
            'confusion' => 3,
        ];

        foreach ($criticalSymptoms as $symptom => $points) {
            if (str_contains($combined, $symptom)) {
                $score += $points;
                $redFlags[] = ucfirst($symptom);
            }
        }

        return $score;
    }

    private function determineTriageLevel(int $score, array $redFlags): string
    {
        // Emergency: Immediate life-threatening
        if ($score >= 10 || !empty(array_intersect($redFlags, [
            'Critical hypoxia', 'Hypertensive crisis', 'Chest pain', 
            'Difficulty breathing', 'Stroke', 'Seizure', 'Unconscious', 
            'Severe bleeding', 'Vomiting blood'
        ]))) {
            return 'emergency';
        }

        // Urgent: Serious but stable
        if ($score >= 6) {
            return 'urgent';
        }

        // Non-urgent: Needs attention soon
        if ($score >= 3) {
            return 'non-urgent';
        }

        // Routine: Can wait
        return 'routine';
    }

    /**
     * Get priority order for queue sorting
     */
    public function getPriorityOrder(string $level): int
    {
        return match($level) {
            'emergency' => 1,
            'urgent' => 2,
            'non-urgent' => 3,
            'routine' => 4,
            default => 5,
        };
    }
}
