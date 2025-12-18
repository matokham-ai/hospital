<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Events\AppointmentUpdated;

class TestBroadcast extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:broadcast {action=test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test real-time broadcasting functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');
        
        $this->info("Testing broadcast with action: {$action}");
        
        // Get the first appointment
        $appointment = Appointment::with(['patient.contacts'])->first();
        
        if (!$appointment) {
            $this->error('No appointments found in database. Please create an appointment first.');
            return 1;
        }
        
        $this->info("Broadcasting update for appointment ID: {$appointment->id}");
        $this->info("Patient: {$appointment->patient->first_name} {$appointment->patient->last_name}");
        
        try {
            broadcast(new AppointmentUpdated($appointment, $action));
            $this->info('✅ Broadcast sent successfully!');
            $this->info('Check your browser console or real-time test page for the update.');
        } catch (\Exception $e) {
            $this->error("❌ Broadcast failed: {$e->getMessage()}");
            return 1;
        }
        
        return 0;
    }
}
