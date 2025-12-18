<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Invoice;
use App\Models\OpdQueue;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        
        // Get real statistics
        $stats = [
            'todayAppointments' => Appointment::whereDate('appointment_date', $today)->count(),
            'waitingPatients' => OpdQueue::where('status', 'WAITING')->count(),
            'checkedInToday' => Appointment::whereDate('appointment_date', $today)
                ->where('status', 'CHECKED_IN')->count(),
            'pendingPayments' => Invoice::where('status', 'unpaid')->count(),
        ];

        // Get today's appointments with pagination and search
        $scheduleQuery = Appointment::with(['patient', 'physician'])
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time');

        // Apply search filters
        if ($request->filled('schedule_search')) {
            $search = $request->get('schedule_search');
            $scheduleQuery->where(function ($query) use ($search) {
                $query->whereHas('patient', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('patient_id', 'like', "%{$search}%");
                })
                ->orWhereHas('physician', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhere('appointment_type', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($request->filled('schedule_status')) {
            $scheduleQuery->where('status', $request->get('schedule_status'));
        }

        if ($request->filled('schedule_type')) {
            $scheduleQuery->where('appointment_type', $request->get('schedule_type'));
        }

        $todaysSchedule = $scheduleQuery->paginate(10, ['*'], 'schedule_page')
            ->through(function ($appointment) {
                return [
                    'time' => Carbon::parse($appointment->appointment_time)->format('h:i A'),
                    'patient' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                    'patient_id' => $appointment->patient->patient_id,
                    'doctor' => $appointment->physician->name ?? 'Unknown Doctor',
                    'type' => ucfirst(str_replace('_', ' ', strtolower($appointment->appointment_type ?? 'Consultation'))),
                    'status' => strtolower($appointment->status),
                    'id' => $appointment->id,
                ];
            });

        // Get current waiting queue with pagination
        $queueQuery = OpdQueue::with(['patient'])
            ->where('status', 'WAITING')
            ->orderBy('queue_number');

        if ($request->filled('queue_search')) {
            $search = $request->get('queue_search');
            $queueQuery->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('patient_id', 'like', "%{$search}%");
            });
        }

        $waitingQueue = $queueQuery->paginate(10, ['*'], 'queue_page')
            ->through(function ($queue) {
                $waitTime = round(Carbon::parse($queue->created_at)->diffInMinutes(Carbon::now()));
                return [
                    'name' => $queue->patient->first_name . ' ' . $queue->patient->last_name,
                    'patient_id' => $queue->patient->patient_id,
                    'waitTime' => $waitTime . ' min',
                    'status' => strtolower($queue->status),
                    'queueNumber' => $queue->queue_number,
                    'id' => $queue->id,
                ];
            });

        return Inertia::render('Receptionist/Dashboard', [
            'stats' => $stats,
            'todaysSchedule' => $todaysSchedule,
            'waitingQueue' => $waitingQueue,
            'userRole' => auth()->user()->getRoleNames()->first() ?? 'Receptionist',
            'filters' => $request->only(['schedule_search', 'schedule_status', 'schedule_type', 'queue_search']),
        ]);
    }
}