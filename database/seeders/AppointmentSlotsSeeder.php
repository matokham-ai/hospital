<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AppointmentSlotsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "📅 Creating Appointment Slots...\n";

        // Get all physicians
        $physicians = DB::table('physicians')->get();
        
        if ($physicians->isEmpty()) {
            echo "⚠️  No physicians found. Please seed physicians first.\n";
            return;
        }

        $slots = [];
        $slotId = 1;

        // Generate slots for the next 30 days
        $startDate = Carbon::now();
        $endDate = Carbon::now()->addDays(30);

        foreach ($physicians as $physician) {
            $currentDate = $startDate->copy();
            
            while ($currentDate <= $endDate) {
                // Skip Sundays for most doctors (except emergency specialization)
                if ($currentDate->dayOfWeek === Carbon::SUNDAY && $physician->specialization !== 'Emergency Medicine') {
                    $currentDate->addDay();
                    continue;
                }

                // Define working hours based on specialization
                $workingHours = $this->getWorkingHours($physician->specialization, $currentDate->dayOfWeek);
                
                foreach ($workingHours as $timeSlot) {
                    $slotDateTime = $currentDate->copy()->setTimeFromTimeString($timeSlot);
                    
                    // Don't create slots in the past
                    if ($slotDateTime < Carbon::now()) {
                        continue;
                    }

                    $slots[] = [
                        'id' => $slotId++,
                        'physician_code' => $physician->physician_code,
                        'department_id' => 1, // Default department
                        'slot_date' => $currentDate->format('Y-m-d'),
                        'start_time' => $timeSlot,
                        'end_time' => Carbon::createFromTimeString($timeSlot)->addMinutes(30)->format('H:i:s'),
                        'duration_minutes' => 30,
                        'max_appointments' => $this->getMaxPatients($physician->specialization),
                        'is_available' => $this->shouldBeAvailable($slotDateTime),
                        'notes' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                
                $currentDate->addDay();
            }
        }

        // Insert in chunks to avoid memory issues
        $chunks = array_chunk($slots, 500);
        foreach ($chunks as $chunk) {
            DB::table('appointment_slots')->insert($chunk);
        }

        echo "✅ Created " . count($slots) . " appointment slots\n";
        
        // Show summary by department
        $this->showSummary();
    }

    /**
     * Get working hours based on specialization and day of week
     */
    private function getWorkingHours($specialization, $dayOfWeek): array
    {
        // Emergency Medicine - 24/7
        if ($specialization === 'Emergency Medicine') {
            return [
                '00:00:00', '00:30:00', '01:00:00', '01:30:00', '02:00:00', '02:30:00',
                '03:00:00', '03:30:00', '04:00:00', '04:30:00', '05:00:00', '05:30:00',
                '06:00:00', '06:30:00', '07:00:00', '07:30:00', '08:00:00', '08:30:00',
                '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
                '12:00:00', '12:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00',
                '15:00:00', '15:30:00', '16:00:00', '16:30:00', '17:00:00', '17:30:00',
                '18:00:00', '18:30:00', '19:00:00', '19:30:00', '20:00:00', '20:30:00',
                '21:00:00', '21:30:00', '22:00:00', '22:30:00', '23:00:00', '23:30:00'
            ];
        }

        // Weekend hours (Saturday)
        if ($dayOfWeek === Carbon::SATURDAY) {
            return [
                '08:00:00', '08:30:00', '09:00:00', '09:30:00', '10:00:00', '10:30:00',
                '11:00:00', '11:30:00', '12:00:00', '12:30:00'
            ];
        }

        // Regular weekday hours
        return [
            '08:00:00', '08:30:00', '09:00:00', '09:30:00', '10:00:00', '10:30:00',
            '11:00:00', '11:30:00', '12:00:00', '12:30:00', '13:00:00', '13:30:00',
            '14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00',
            '17:00:00', '17:30:00'
        ];
    }

    /**
     * Determine if a slot should be available (some randomization for realism)
     */
    private function shouldBeAvailable($slotDateTime): bool
    {
        // Past slots are not available
        if ($slotDateTime < Carbon::now()) {
            return false;
        }

        // Lunch break (12:30-13:30) - lower availability
        $hour = $slotDateTime->hour;
        $minute = $slotDateTime->minute;
        if ($hour === 12 && $minute >= 30 || $hour === 13 && $minute < 30) {
            return rand(1, 100) <= 30; // 30% chance during lunch
        }

        // Early morning and late evening - lower availability
        if ($hour < 8 || $hour > 17) {
            return rand(1, 100) <= 70; // 70% chance
        }

        // Peak hours - normal availability
        return rand(1, 100) <= 85; // 85% chance during peak hours
    }

    /**
     * Get maximum patients per slot based on specialization
     */
    private function getMaxPatients($specialization): int
    {
        return match($specialization) {
            'Emergency Medicine' => 3, // Emergency - multiple patients
            'Cardiology' => 1, // Cardiology - one patient
            'Pediatrics' => 2, // Pediatrics - can handle 2
            'Orthopedics' => 1, // Orthopedics - one patient
            'Radiology' => 2, // Radiology - can handle 2
            'General Medicine' => 2, // General - can handle 2
            default => 1
        };
    }

    /**
     * Show summary of created slots
     */
    private function showSummary(): void
    {
        echo "\n📊 Appointment Slots Summary:\n";
        
        $summary = DB::table('appointment_slots as a')
            ->join('physicians as p', 'a.physician_code', '=', 'p.physician_code')
            ->select('p.specialization as department', DB::raw('COUNT(*) as total_slots'), DB::raw('SUM(CASE WHEN a.is_available = 1 THEN 1 ELSE 0 END) as available_slots'))
            ->groupBy('p.specialization')
            ->orderBy('p.specialization')
            ->get();

        foreach ($summary as $dept) {
            $availablePercent = round(($dept->available_slots / $dept->total_slots) * 100, 1);
            echo "   - {$dept->department}: {$dept->total_slots} slots ({$dept->available_slots} available - {$availablePercent}%)\n";
        }

        $totalSlots = DB::table('appointment_slots')->count();
        $availableSlots = DB::table('appointment_slots')->where('is_available', true)->count();
        $availablePercent = round(($availableSlots / $totalSlots) * 100, 1);
        
        echo "\n🎯 Total: {$totalSlots} slots ({$availableSlots} available - {$availablePercent}%)\n";
    }
}