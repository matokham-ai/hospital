<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Appointment;

class AppointmentController extends Controller
{

    public function __construct()
    {
        // For API routes, middleware should be applied in routes/api.php
        // This constructor can be removed or used for other initialization
    }


    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Appointment::query();
        $data = $query->with(['patient','physician','department','slot']).paginate(20);
        return response()->json(['message' => 'Appointment list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'appointment_number' => 'nullable|string|unique:appointments,appointment_number',
                'patient_id' => 'required|string|exists:patients,id',
                'physician_id' => 'required|string',
                'department_id' => 'nullable|string',
                'appointment_slot_id' => 'nullable|integer|exists:appointment_slots,id',
                'appointment_type' => 'required|in:SCHEDULED,WALK_IN,EMERGENCY',
                'status' => 'nullable|in:SCHEDULED,CONFIRMED,CHECKED_IN,IN_PROGRESS,COMPLETED,CANCELLED,NO_SHOW',
                'appointment_date' => 'required|date',
                'appointment_time' => 'required',
                'chief_complaint' => 'nullable|string',
                'appointment_notes' => 'nullable|string',
                'encounter_id' => 'nullable|string',
                'checked_in_at' => 'nullable|date',
                'started_at' => 'nullable|date',
                'completed_at' => 'nullable|date',
                'created_by' => 'required|string',
            ]);
        
        $record = Appointment::create($validated);
        $record->load(['patient','physician','department','slot']);
        return response()->json(['message' => 'Appointment created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Appointment::with(['patient','physician','department','slot']).findOrFail($id);
        return response()->json(['message' => 'Appointment details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'physician_id' => 'sometimes|string',
                'department_id' => 'sometimes|string',
                'appointment_slot_id' => 'sometimes|integer|exists:appointment_slots,id',
                'appointment_type' => 'sometimes|in:SCHEDULED,WALK_IN,EMERGENCY',
                'status' => 'sometimes|in:SCHEDULED,CONFIRMED,CHECKED_IN,IN_PROGRESS,COMPLETED,CANCELLED,NO_SHOW',
                'appointment_date' => 'sometimes|date',
                'appointment_time' => 'sometimes',
                'chief_complaint' => 'sometimes|string',
                'appointment_notes' => 'sometimes|string',
                'encounter_id' => 'nullable|string',
                'checked_in_at' => 'nullable|date',
                'started_at' => 'nullable|date',
                'completed_at' => 'nullable|date',
            ]);
        
        $record = Appointment::findOrFail($id);
        $record->update($validated);
        $record->load(['patient','physician','department','slot']);
        return response()->json(['message' => 'Appointment updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Appointment::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Appointment deleted', 'data' => $record], 200);
    }

    public function doctorEvents(Request $request)
    {
        $user = $request->user();

        // 🔐 Determine appointments scope
        if ($user->hasRole('Admin')) {
            $appointments = \App\Models\Appointment::with(['patient'])
                ->whereNull('deleted_at')
                ->whereNotIn('status', ['CANCELLED', 'NO_SHOW'])
                ->get();
        } else {
            $physician = \DB::table('physicians')->where('user_id', $user->id)->first();

            if (!$physician) {
                return response()->json(['message' => 'Physician record not found'], 404);
            }

            $appointments = \App\Models\Appointment::with(['patient'])
                ->where('physician_id', $physician->physician_code)
                ->whereNull('deleted_at')
                ->whereNotIn('status', ['CANCELLED', 'NO_SHOW'])
                ->get();
        }

        if ($appointments->isEmpty()) {
            return response()->json([]);
        }

        // 🎨 Status-based color scheme
        $statusColors = [
            'SCHEDULED'   => '#3b82f6', // blue
            'CONFIRMED'   => '#10b981', // emerald
            'CHECKED_IN'  => '#8b5cf6', // violet
            'IN_PROGRESS' => '#f59e0b', // amber
            'COMPLETED'   => '#0284c7', // sky
            'CANCELLED'   => '#ef4444', // red
            'NO_SHOW'     => '#9ca3af', // gray
        ];

        $events = $appointments->map(function ($a) use ($statusColors) {
            $start = "{$a->appointment_date}T{$a->appointment_time}";
            $endTime = date('H:i:s', strtotime($a->appointment_time . ' +45 minutes'));
            $end = "{$a->appointment_date}T{$endTime}";

            $status = strtoupper($a->status);
            $color = $statusColors[$status] ?? '#14b8a6'; // fallback teal

            $patientName = optional($a->patient)->first_name . ' ' . optional($a->patient)->last_name;
            $patientName = trim($patientName) ?: 'Unknown Patient';
            $complaint = $a->chief_complaint ?: 'Consultation';

            return [
                'id'        => $a->id,
                'title'     => "{$patientName} – {$complaint}",
                'start'     => $start,
                'end'       => $end,
                'color'     => $color,
                'status'    => $status,
                'extendedProps' => [
                    'tooltip' => "Patient: {$patientName}\nStatus: {$status}\nComplaint: {$complaint}",
                ],
            ];
        });

        return response()->json($events);
    }

    public function completeConsultation($id)
    {
        $appointment = Appointment::findOrFail($id);

        // Update appointment status
        $appointment->status = 'completed';
        $appointment->save();

        // If you have a queue table or model, also mark that record completed
        if ($appointment->queueItem) {
            $appointment->queueItem->update(['status' => 'completed']);
        }

        return response()->json(['success' => true, 'message' => 'Consultation completed successfully.']);
    }

    
}
