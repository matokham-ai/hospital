<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DoctorRoundsSeeder extends Seeder
{
    public function run()
    {
        // Get some patient IDs and user IDs
        $patientIds = DB::table('patients')->pluck('id')->take(8)->toArray();
        $doctorIds = DB::table('users')->pluck('id')->take(3)->toArray();
        
        if (empty($patientIds) || empty($doctorIds)) {
            $this->command->info('No patients or users found. Please seed patients and users first.');
            return;
        }

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        
        $rounds = [];
        $notes = [];

        // Create rounds for today and yesterday
        foreach ([$yesterday, $today] as $date) {
            foreach ($doctorIds as $doctorId) {
                // Assign 3-4 patients per doctor per day
                $assignedPatients = array_slice($patientIds, 0, rand(3, 4));
                
                foreach ($assignedPatients as $index => $patientId) {
                    $status = $this->getRandomStatus($date->isToday());
                    $startTime = null;
                    $endTime = null;
                    
                    if ($status === 'in_progress' || $status === 'completed') {
                        $startTime = $date->copy()->addHours(8 + $index)->format('H:i:s');
                    }
                    
                    if ($status === 'completed') {
                        $endTime = $date->copy()->addHours(8 + $index)->addMinutes(rand(15, 45))->format('H:i:s');
                    }

                    $roundId = DB::table('doctor_rounds')->insertGetId([
                        'patient_id' => $patientId,
                        'doctor_id' => $doctorId,
                        'round_date' => $date->format('Y-m-d'),
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'status' => $status,
                        'notes' => $this->getRandomNote(),
                        'assessment' => $status === 'completed' ? $this->getRandomAssessment() : null,
                        'plan' => $status === 'completed' ? $this->getRandomPlan() : null,
                        'electronic_signature' => $status === 'completed' ? 'Dr. ' . $doctorId : null,
                        'signed_at' => $status === 'completed' ? $date->copy()->addHours(8 + $index)->addMinutes(30) : null,
                        'created_at' => $date->copy()->addHours(7),
                        'updated_at' => now(),
                    ]);

                    // Add some sample notes for completed rounds
                    if ($status === 'completed') {
                        $sampleNotes = [
                            ['type' => 'observation', 'note' => 'Patient appears comfortable and alert. No acute distress noted.'],
                            ['type' => 'vital_signs', 'note' => 'BP: 120/80, HR: 72, Temp: 98.6°F, RR: 16, O2 Sat: 98%'],
                            ['type' => 'assessment', 'note' => 'Stable condition. Responding well to current treatment plan.'],
                            ['type' => 'plan', 'note' => 'Continue current medications. Monitor vital signs q4h. Ambulate as tolerated.'],
                        ];

                        foreach ($sampleNotes as $noteData) {
                            DB::table('round_notes')->insert([
                                'round_id' => $roundId,
                                'note' => $noteData['note'],
                                'type' => $noteData['type'],
                                'created_by' => $doctorId,
                                'created_at' => $date->copy()->addHours(8 + $index)->addMinutes(rand(5, 25)),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }
        }

        $this->command->info('Doctor rounds seeded successfully!');
    }

    private function getRandomStatus($isToday)
    {
        if ($isToday) {
            // For today, mix of all statuses
            $statuses = ['pending', 'in_progress', 'completed', 'late'];
            return $statuses[array_rand($statuses)];
        } else {
            // For yesterday, mostly completed
            $statuses = ['completed', 'completed', 'completed', 'late'];
            return $statuses[array_rand($statuses)];
        }
    }

    private function getRandomNote()
    {
        $notes = [
            'Patient scheduled for routine morning rounds.',
            'Follow-up on yesterday\'s concerns.',
            'Post-operative check required.',
            'Medication review needed.',
            'Patient requested consultation.',
            'Discharge planning discussion.',
            'Family meeting scheduled.',
            'Pain management assessment.',
        ];

        return $notes[array_rand($notes)];
    }

    private function getRandomAssessment()
    {
        $assessments = [
            'Patient is stable and improving. Vital signs within normal limits.',
            'Good response to treatment. No complications noted.',
            'Mild improvement in symptoms. Continue current therapy.',
            'Patient comfortable. Pain well controlled.',
            'Stable condition. Ready for discharge planning.',
            'Excellent progress. Meeting all recovery milestones.',
        ];

        return $assessments[array_rand($assessments)];
    }

    private function getRandomPlan()
    {
        $plans = [
            'Continue current medications. Follow-up in 24 hours.',
            'Increase ambulation. Physical therapy consultation.',
            'Monitor vital signs q4h. Lab work in AM.',
            'Discharge planning. Home care arrangements.',
            'Pain medication adjustment. Reassess in 6 hours.',
            'Continue IV antibiotics. Culture results pending.',
        ];

        return $plans[array_rand($plans)];
    }
}