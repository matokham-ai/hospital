<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Bed;
use App\Models\LabOrder;
use App\Models\Prescription;
use App\Models\Invoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $userRole = $user ? $user->getRoleNames()->first() : null;

        // Get dashboard data based on role
        $dashboardData = $this->getDashboardData($userRole);

        // Redirect Admin users to dedicated admin dashboard
        if ($userRole === 'Admin') {
            return redirect()->route('admin.dashboard');
        }

        // Redirect Doctor users to dedicated doctor dashboard
        if ($userRole === 'Doctor') {
            return redirect()->route('doctor.dashboard');
        }
        // Redirect Nurse users to dedicated doctor dashboard
        if ($userRole === 'Nurse') {
            return redirect()->route('nurse.dashboard');
        }

        // Redirect Receptionist users to dedicated receptionist dashboard
        if ($userRole === 'Receptionist') {
            return redirect()->route('receptionist.dashboard');
        }

        // Determine which dashboard to show based on role
        $dashboardComponent = match($userRole) {
            'Doctor' => 'Doctor/Dashboard',
            'Nurse' => 'Nurse/Dashboard',
            'Pharmacist' => 'Pharmacist/Dashboard',
            'Receptionist' => 'Receptionist/Dashboard',
            'Lab Technician' => 'Dashboard',
            'Cashier' => 'Dashboard',
            'Radiologist' => 'Dashboard',
            default => 'Dashboard'
        };

        return inertia($dashboardComponent, array_merge($dashboardData, [
            'userRole' => $userRole,
            'userName' => $user ? $user->name : null,
            'userEmail' => $user ? $user->email : null,
        ]));
    }

    private function getDashboardData($role)
    {
        $today = Carbon::today();

        $baseData = [
            'kpis' => $this->getKPIs($today),
            'recentActivity' => $this->getRecentActivity(),
            'alerts' => $this->getSystemAlerts(),
        ];

        return match($role) {
            'Admin' => array_merge($baseData, [
                'departmentWorkload' => $this->getDepartmentWorkload(),
                'revenueData' => $this->getRevenueData(),
            ]),
            'Doctor' => array_merge($baseData, [
                'todaySchedule' => $this->getDoctorSchedule($today),
                'pendingTasks' => $this->getDoctorTasks(),
                'kpis' => array_merge($baseData['kpis'], [
                    'completedToday' => Appointment::where('status', 'COMPLETED')->whereDate('appointment_date', $today)->count(),
                    'pendingReviews' => LabOrder::where('status', 'pending')->count(),
                    'activePrescriptions' => Prescription::where('status', 'pending')->count(),
                ]),
            ]),
            'Nurse' => array_merge($baseData, [
                'patientAssignments' => $this->getNursePatients(),
                'medications' => $this->getMedicationSchedule(),
            ]),
            'Pharmacist' => array_merge($baseData, [
                'prescriptions' => $this->getPendingPrescriptions(),
                'inventory' => $this->getInventoryStatus(),
            ]),
            'Receptionist' => array_merge($baseData, [
                'todayAppointments' => $this->getTodayAppointments(),
                'waitingPatients' => $this->getWaitingPatients(),
            ]),
            default => $baseData
        };
    }

    private function getKPIs($today)
    {
        return [
            'todayAppointments' => Appointment::whereDate('appointment_date', $today)->count(),
            'activeAdmissions' => Bed::where('status', 'occupied')->count(),
            'pendingBills' => Invoice::where('status', 'unpaid')->count(),
            'labsPending' => LabOrder::where('status', 'pending')->count(),
            'bedOccupancy' => $this->getBedOccupancyRate(),
            'totalRevenue' => Invoice::where('status', 'paid')
                ->whereDate('created_at', $today)
                ->sum('paid_amount'),
            'patientsToday' => Patient::whereDate('created_at', $today)->count(),
            'activeConsultations' => Appointment::where('status', 'IN_PROGRESS')->count(),
            'urgentLabTests' => LabOrder::where('status', 'pending')
                ->count() > 10 ? 8 : 3, // Mock urgent count
        ];
    }

    private function getBedOccupancyRate()
    {
        $totalBeds = Bed::count();
        $occupiedBeds = Bed::where('status', 'occupied')->count();

        return $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100) : 0;
    }

    private function getRecentActivity()
    {
        $activities = collect();

        // Recent appointments
        $recentAppointments = Appointment::with(['patient'])
            ->where('created_at', '>=', Carbon::now()->subHours(6))
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'type' => 'appointment',
                    'message' => "Appointment {$appointment->status} for {$appointment->patient->first_name} {$appointment->patient->last_name}",
                    'time' => $appointment->created_at->diffForHumans(),
                    'priority' => $appointment->status === 'completed' ? 'normal' : 'medium'
                ];
            });

        // Recent lab orders
        $recentLabs = LabOrder::with('patient')
            ->where('created_at', '>=', Carbon::now()->subHours(6))
            ->latest()
            ->take(2)
            ->get()
            ->map(function ($lab) {
                return [
                    'id' => $lab->id,
                    'type' => 'lab',
                    'message' => "Lab test {$lab->status}: {$lab->test_name} for {$lab->patient->first_name} {$lab->patient->last_name}",
                    'time' => $lab->created_at->diffForHumans(),
                    'priority' => $lab->priority === 'urgent' ? 'high' : 'normal'
                ];
            });

        // Recent invoices
        $recentInvoices = Invoice::with('patient')
            ->where('created_at', '>=', Carbon::now()->subHours(6))
            ->latest()
            ->take(2)
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'type' => 'billing',
                    'message' => "Invoice {$invoice->status} - {$invoice->invoice_number} for {$invoice->patient->first_name} {$invoice->patient->last_name}",
                    'time' => $invoice->created_at->diffForHumans(),
                    'priority' => $invoice->status === 'overdue' ? 'high' : 'normal'
                ];
            });

        return $activities->merge($recentAppointments)->merge($recentLabs)->merge($recentInvoices)->take(5)->values();
    }

    private function getSystemAlerts()
    {
        $alerts = [];

        // Bed capacity alert
        $occupancyRate = $this->getBedOccupancyRate();
        if ($occupancyRate >= 90) {
            $alerts[] = [
                'id' => 1,
                'message' => "Bed capacity at {$occupancyRate}% - Consider discharge planning",
                'type' => 'warning'
            ];
        }

        // Pending lab tests
        $pendingLabs = LabOrder::where('status', 'pending')->count();
        if ($pendingLabs > 20) {
            $alerts[] = [
                'id' => 2,
                'message' => "{$pendingLabs} lab tests pending - Lab may be overloaded",
                'type' => 'warning'
            ];
        }

        // Overdue invoices
        $overdueInvoices = Invoice::where('status', 'overdue')->count();
        if ($overdueInvoices > 0) {
            $alerts[] = [
                'id' => 3,
                'message' => "{$overdueInvoices} invoices are overdue",
                'type' => 'error'
            ];
        }

        return $alerts;
    }

    private function getDepartmentWorkload()
    {
        return [
            ['dept' => 'Emergency', 'load' => 85, 'color' => 'red'],
            ['dept' => 'Surgery', 'load' => 72, 'color' => 'blue'],
            ['dept' => 'Pediatrics', 'load' => 68, 'color' => 'green'],
            ['dept' => 'Cardiology', 'load' => 45, 'color' => 'purple'],
        ];
    }

    private function getRevenueData()
    {
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $revenue = Invoice::where('status', 'paid')
                ->whereDate('created_at', $date)
                ->sum('total_amount');

            $last7Days->push([
                'date' => $date->format('M d'),
                'revenue' => $revenue
            ]);
        }

        return $last7Days;
    }

    private function getDoctorSchedule($today)
    {
        return Appointment::with(['patient'])
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                    'patient' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                    'type' => 'Consultation',
                    'status' => strtolower($appointment->status)
                ];
            });
    }

    private function getDoctorTasks()
    {
        $pendingLabs = LabOrder::where('status', 'pending')->count();
        $completedAppointments = Appointment::where('status', 'COMPLETED')->whereDate('appointment_date', Carbon::today())->count();

        return [
            [
                'id' => 1,
                'task' => "Review {$pendingLabs} pending lab results",
                'priority' => 'high',
                'time' => '2 hours ago'
            ],
            [
                'id' => 2,
                'task' => "Complete {$completedAppointments} discharge summaries",
                'priority' => 'medium',
                'time' => '4 hours ago'
            ]
        ];
    }

    private function getNursePatients()
    {
        return Bed::with(['patient'])
            ->where('status', 'occupied')
            ->take(10)
            ->get()
            ->map(function ($bed) {
                return [
                    'id' => $bed->id,
                    'name' => $bed->patient ? $bed->patient->first_name . ' ' . $bed->patient->last_name : 'Unknown',
                    'room' => $bed->bed_number,
                    'condition' => $bed->bed_type === 'ICU' ? 'Critical' : 'Stable',
                    'lastVitals' => '2 hours ago'
                ];
            });
    }

    private function getMedicationSchedule()
    {
        return Prescription::with('patient')
            ->where('status', 'active')
            ->take(5)
            ->get()
            ->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'patient' => $prescription->patient->first_name . ' ' . $prescription->patient->last_name,
                    'medication' => $prescription->medication_name . ' ' . $prescription->dosage,
                    'time' => '14:00',
                    'status' => 'due'
                ];
            });
    }

    private function getPendingPrescriptions()
    {
        return Prescription::with(['patient'])
            ->where('status', 'active')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'patient' => $prescription->patient->first_name . ' ' . $prescription->patient->last_name,
                    'medication' => $prescription->medication_name . ' ' . $prescription->dosage,
                    'status' => 'pending',
                    'time' => $prescription->created_at->format('H:i')
                ];
            });
    }

    private function getInventoryStatus()
    {
        return [
            ['id' => 1, 'name' => 'Paracetamol 500mg', 'stock' => 45, 'minLevel' => 50, 'status' => 'low'],
            ['id' => 2, 'name' => 'Amoxicillin 250mg', 'stock' => 120, 'minLevel' => 100, 'status' => 'good'],
            ['id' => 3, 'name' => 'Insulin Pen', 'stock' => 8, 'minLevel' => 20, 'status' => 'critical'],
            ['id' => 4, 'name' => 'Aspirin 75mg', 'stock' => 200, 'minLevel' => 50, 'status' => 'good'],
        ];
    }

    private function getTodayAppointments()
    {
        return Appointment::with(['patient', 'physician'])
            ->whereDate('appointment_date', Carbon::today())
            ->orderBy('appointment_time')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                    'patient' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                    'doctor' => $appointment->physician->name ?? 'TBD',
                    'type' => 'Consultation',
                    'status' => $appointment->status
                ];
            });
    }

    private function getWaitingPatients()
    {
        return Appointment::with('patient')
            ->where('status', 'scheduled')
            ->whereDate('appointment_date', Carbon::today())
            ->where('appointment_time', '<=', Carbon::now()->addMinutes(30))
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'name' => $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
                    'appointmentTime' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                    'waitTime' => Carbon::parse($appointment->appointment_time)->diffForHumans(),
                    'priority' => 'normal'
                ];
            });
    }
}
