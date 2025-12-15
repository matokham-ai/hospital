<?php

namespace App\Events;

use App\Models\OpdAppointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OpdAppointmentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $opdAppointment;
    public $action;

    /**
     * Create a new event instance.
     */
    public function __construct(OpdAppointment $opdAppointment, string $action = 'updated')
    {
        $this->opdAppointment = $opdAppointment;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('appointments'),
            new Channel('opd-appointments'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'opd-appointment.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        // Load the appointment with patient data for broadcasting
        $this->opdAppointment->load(['patient']);

        try {
            // Get the date in Y-m-d format
            $dateStr = \Carbon\Carbon::parse($this->opdAppointment->appointment_date)->format('Y-m-d');
            
            // Handle the time - extract just the time part
            $timeStr = $this->opdAppointment->appointment_time;
            
            // If appointment_time is a full datetime, extract just the time
            if (strlen($timeStr) > 8) {
                $timeStr = \Carbon\Carbon::parse($timeStr)->format('H:i:s');
            }
            
            // Fix invalid times like 24:00:00
            if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $timeStr, $matches)) {
                $hour = (int)$matches[1];
                if ($hour >= 24) {
                    $hour = $hour - 24; // Convert 24:00 to 00:00, etc.
                }
                $timeStr = sprintf('%02d:%s:%s', $hour, $matches[2], $matches[3]);
            }

            // Create proper ISO datetime strings
            $start = "{$dateStr}T{$timeStr}";
            
            // Calculate end time safely
            try {
                $endDateTime = \Carbon\Carbon::parse("{$dateStr} {$timeStr}")->addMinutes(45);
                $end = $endDateTime->format('Y-m-d\TH:i:s');
            } catch (\Exception $e) {
                $end = $start; // fallback to same time
            }

            $status = strtoupper($this->opdAppointment->status);
            
            // Status-based color scheme
            $statusColors = [
                'SCHEDULED'   => '#3b82f6', // blue
                'CONFIRMED'   => '#10b981', // emerald
                'CHECKED_IN'  => '#8b5cf6', // violet
                'IN_PROGRESS' => '#f59e0b', // amber
                'COMPLETED'   => '#0284c7', // sky
                'CANCELLED'   => '#ef4444', // red
                'NO_SHOW'     => '#9ca3af', // gray
            ];
            
            $color = $statusColors[$status] ?? '#14b8a6'; // fallback teal

            $patient = $this->opdAppointment->patient;
            $patientName = $patient ? trim($patient->first_name . ' ' . $patient->last_name) : 'Unknown Patient';
            $complaint = $this->opdAppointment->chief_complaint ?: 'General consultation';

            return [
                'action' => $this->action,
                'appointment' => [
                    'id'        => $this->opdAppointment->id,
                    'title'     => "{$patientName} – {$complaint}",
                    'start'     => $start,
                    'end'       => $end,
                    'color'     => $color,
                    'status'    => $status,
                    'extendedProps' => [
                        'appointmentId' => $this->opdAppointment->id,
                        'patient' => $patient ? [
                            'id' => $patient->id,
                            'first_name' => $patient->first_name,
                            'last_name' => $patient->last_name,
                            'full_name' => $patientName,
                            'date_of_birth' => $patient->date_of_birth,
                            'gender' => $patient->gender,
                            'phone' => $patient->phone ?? 'N/A',
                            'allergies' => $patient->allergies ?? [],
                            'chronic_conditions' => $patient->chronic_conditions ?? [],
                            'alerts' => $patient->alerts ?? [],
                        ] : null,
                        'appointment' => [
                            'date' => $dateStr,
                            'time' => $timeStr,
                            'status' => $status,
                            'chief_complaint' => $complaint,
                            'notes' => $this->opdAppointment->notes,
                            'physician_id' => $this->opdAppointment->physician_id ?? null,
                            'department_id' => $this->opdAppointment->department_id ?? null,
                        ],
                        'tooltip' => "Patient: {$patientName}\nStatus: {$status}\nComplaint: {$complaint}",
                    ],
                ]
            ];
        } catch (\Exception $e) {
            \Log::error('Broadcast OPD appointment error', [
                'opd_appointment_id' => $this->opdAppointment->id,
                'error' => $e->getMessage(),
            ]);
            
            // Return minimal data on error
            return [
                'action' => $this->action,
                'appointment' => [
                    'id' => $this->opdAppointment->id,
                    'status' => strtoupper($this->opdAppointment->status),
                ]
            ];
        }
    }
}