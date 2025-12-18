<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $today = Carbon::today();
        
        // Get doctor's appointments for today
        $todaySchedule = Appointment::with(['patient', 'physician'])
            ->whereDate('appointment_date', $today)
            ->where('physician_id', $user->id ?? 1) // Use authenticated user's ID or fallback
            ->orderBy('appointment_time')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                    'patient' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                    'type' => ucfirst(str_replace('_', ' ', strtolower($appointment->appointment_type ?? 'Consultation'))),
                    'status' => strtolower($appointment->status),
                ];
            });

        // Get pending tasks (simplified for now)
        $pendingTasks = collect([
            [
                'id' => 1,
                'task' => 'Complete consultation notes',
                'priority' => 'high',
                'time' => '2 hours ago',
                'count' => Appointment::where('status', 'IN_PROGRESS')->count()
            ],
            [
                'id' => 2,
                'task' => 'Review pending appointments',
                'priority' => 'medium', 
                'time' => '4 hours ago',
                'count' => Appointment::where('status', 'SCHEDULED')->count()
            ],
            [
                'id' => 3,
                'task' => 'Follow up with completed patients',
                'priority' => 'low',
                'time' => '1 day ago',
                'count' => Appointment::where('status', 'COMPLETED')->whereDate('appointment_date', $today)->count()
            ],
        ])->filter(function ($task) {
            return $task['count'] > 0;
        })->values();

        // Calculate KPIs
        $kpis = [
            'todayAppointments' => Appointment::whereDate('appointment_date', $today)
                ->where('physician_id', $user->id ?? 1)
                ->count(),
            'completedToday' => Appointment::whereDate('appointment_date', $today)
                ->where('physician_id', $user->id ?? 1)
                ->where('status', 'COMPLETED')
                ->count(),
            'pendingReviews' => Appointment::where('status', 'IN_PROGRESS')->count(),
            'activePrescriptions' => Appointment::where('status', 'COMPLETED')
                ->whereDate('appointment_date', $today)
                ->count(),
        ];

        return Inertia::render('Doctor/Dashboard', [
            'userName' => $user->name ?? 'Doctor',
            'userEmail' => $user->email ?? '',
            'userRole' => $user->getRoleNames()->first() ?? 'Doctor',
            'kpis' => $kpis,
            'todaySchedule' => $todaySchedule,
            'pendingTasks' => $pendingTasks,
        ]);
    }
}