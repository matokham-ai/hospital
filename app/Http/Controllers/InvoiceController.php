<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('invoices')
            ->join('patients', 'invoices.patient_id', '=', 'patients.id')
            ->leftJoin('encounters', 'invoices.encounter_id', '=', 'encounters.id')
            ->leftJoin('appointments', 'invoices.encounter_id', '=', 'appointments.id')
            ->leftJoin('opd_appointments', 'invoices.encounter_id', '=', 'opd_appointments.id')
            ->select(
                'invoices.*',
                DB::raw("CONCAT(patients.first_name, ' ', patients.last_name) as patient_name"),
                'patients.phone',
                DB::raw("COALESCE(encounters.encounter_number, appointments.appointment_number, opd_appointments.appointment_number, CONCAT('ENC', invoices.encounter_id)) as encounter_number")
            )
            ->orderByDesc('invoices.created_at');

        // Apply filters
        if ($request->filled('status')) {
            $query->where('invoices.status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('patients.first_name', 'like', "%{$search}%")
                  ->orWhere('patients.last_name', 'like', "%{$search}%")
                  ->orWhere('encounters.encounter_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('invoices.created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('invoices.created_at', '<=', $request->date_to);
        }

        $invoices = $query->paginate(15)->withQueryString();

        // Get summary statistics
        $stats = [
            'total_invoices' => DB::table('invoices')->count(),
            'total_amount' => DB::table('invoices')->sum('total_amount'),
            'paid_amount' => DB::table('invoices')->sum('paid_amount'),
            'outstanding' => DB::table('invoices')->sum('balance'),
            'by_status' => DB::table('invoices')
                ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as amount'))
                ->groupBy('status')
                ->get()
        ];

        return Inertia::render('Billing/Invoices', [
            'invoices' => $invoices,
            'stats' => $stats,
            'filters' => $request->only(['status', 'search', 'date_from', 'date_to'])
        ]);
    }

    public function show($id)
    {
        $invoice = DB::table('invoices')
            ->join('patients', 'invoices.patient_id', '=', 'patients.id')
            ->leftJoin('encounters', 'invoices.encounter_id', '=', 'encounters.id')
            ->leftJoin('appointments', 'invoices.encounter_id', '=', 'appointments.id')
            ->leftJoin('opd_appointments', 'invoices.encounter_id', '=', 'opd_appointments.id')
            ->select(
                'invoices.*',
                DB::raw("CONCAT(patients.first_name, ' ', patients.last_name) as patient_name"),
                'patients.phone',
                'patients.email',
                DB::raw("COALESCE(encounters.encounter_number, appointments.appointment_number, opd_appointments.appointment_number, CONCAT('ENC', invoices.encounter_id)) as encounter_number"),
                DB::raw("COALESCE(encounters.type, 'OPD') as encounter_type")
            )
            ->where('invoices.id', $id)
            ->first();

        if (!$invoice) {
            return redirect()->route('invoices.index')->with('error', 'Invoice not found');
        }

        // Get invoice items
        $items = DB::table('billing_items')
            ->where('encounter_id', $invoice->encounter_id)
            ->get();

        // Get payments
        $payments = DB::table('payments')
            ->where('invoice_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Billing/InvoiceDetails', [
            'invoice' => $invoice,
            'items' => $items,
            'payments' => $payments
        ]);
    }
}
