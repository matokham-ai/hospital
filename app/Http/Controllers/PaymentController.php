<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Get payments with invoice and patient information
            $query = DB::table('payments')
                ->leftJoin('invoices', 'payments.invoice_id', '=', 'invoices.id')
                ->leftJoin('patients', 'invoices.patient_id', '=', 'patients.id')
                ->leftJoin('encounters', 'invoices.encounter_id', '=', 'encounters.id')
                ->select(
                    'payments.*',
                    DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, '')) as patient_name"),
                    'encounters.encounter_number'
                )
                ->orderByDesc('payments.created_at');

            // Apply filters
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('payments.reference_no', 'like', "%{$search}%")
                      ->orWhere(DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, ''))"), 'like', "%{$search}%");
                });
            }

            if ($request->filled('method')) {
                $query->where('payments.method', $request->method);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('payments.created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('payments.created_at', '<=', $request->date_to);
            }

            // Get paginated results
            $payments = $query->paginate(15)->withQueryString();

            // Transform the data to match our interface
            $payments->getCollection()->transform(function ($payment) {
                return [
                    'id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'reference_no' => $payment->reference_no,
                    'payment_date' => $payment->created_at, // Use created_at as payment_date
                    'notes' => $payment->notes,
                    'status' => 'completed', // Default status since table doesn't have this field
                    'created_at' => $payment->created_at,
                    'invoice' => [
                        'id' => $payment->invoice_id,
                        'patient_name' => $payment->patient_name ?: 'Unknown Patient',
                        'encounter_number' => $payment->encounter_number ?: 'N/A'
                    ]
                ];
            });

            // Get statistics
            $stats = [
                'total_payments' => DB::table('payments')->count(),
                'total_amount' => (float) DB::table('payments')->sum('amount'),
                'today_payments' => DB::table('payments')->whereDate('created_at', today())->count(),
                'today_amount' => (float) DB::table('payments')->whereDate('created_at', today())->sum('amount'),
                'by_method' => DB::table('payments')
                    ->select('method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as amount'))
                    ->groupBy('method')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'method' => $item->method,
                            'count' => (int) $item->count,
                            'amount' => (float) $item->amount
                        ];
                    })
            ];

            // Get unpaid invoices for new payment option
            $unpaidInvoices = DB::table('invoices')
                ->leftJoin('patients', 'invoices.patient_id', '=', 'patients.id')
                ->leftJoin('encounters', 'invoices.encounter_id', '=', 'encounters.id')
                ->select(
                    'invoices.*',
                    DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, '')) as patient_name"),
                    'patients.phone',
                    'patients.email',
                    'encounters.encounter_number',
                    'encounters.type as encounter_type'
                )
                ->where('invoices.balance', '>', 0)
                ->orderByDesc('invoices.created_at')
                ->limit(10)
                ->get()
                ->map(function ($invoice) {
                    return [
                        'id' => $invoice->id,
                        'patient_name' => $invoice->patient_name ?: 'Unknown Patient',
                        'phone' => $invoice->phone,
                        'email' => $invoice->email,
                        'encounter_number' => $invoice->encounter_number ?: 'N/A',
                        'encounter_type' => $invoice->encounter_type ?: 'Unknown',
                        'total_amount' => (float) $invoice->total_amount,
                        'paid_amount' => (float) $invoice->paid_amount,
                        'balance' => (float) $invoice->balance,
                        'discount' => (float) ($invoice->discount ?? 0),
                        'status' => $invoice->status
                    ];
                });

            return Inertia::render('Billing/Payments', [
                'payments' => $payments,
                'stats' => $stats,
                'filters' => $request->only(['search', 'method', 'status', 'date_from', 'date_to']),
                'invoices' => $unpaidInvoices
            ]);

        } catch (\Exception $e) {
            // Fallback with empty data if there's an error
            return Inertia::render('Billing/Payments', [
                'payments' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 15,
                    'total' => 0
                ],
                'stats' => [
                    'total_payments' => 0,
                    'total_amount' => 0,
                    'today_payments' => 0,
                    'today_amount' => 0,
                    'by_method' => []
                ],
                'filters' => $request->only(['search', 'method', 'status', 'date_from', 'date_to']),
                'invoices' => [],
                'error' => 'Unable to load payment data: ' . $e->getMessage()
            ]);
        }
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|string|in:cash,card,mpesa,bank',
            'reference_no' => 'nullable|string|max:255',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120' // 5MB max
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();

            // Get the invoice
            $invoice = Invoice::findOrFail($request->invoice_id);

            // Validate payment amount doesn't exceed balance
            if ($request->amount > $invoice->balance) {
                return redirect()->back()
                    ->withErrors(['amount' => 'Payment amount cannot exceed the outstanding balance.'])
                    ->withInput();
            }

            // Handle receipt upload
            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('payment-receipts', 'public');
            }

            // Create payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount' => $request->amount,
                'method' => $request->method,
                'reference_no' => $request->reference_no ?? $this->generateReferenceNumber($request->method),
                'payment_date' => $request->payment_date,
                'notes' => $request->notes,
                'receipt_path' => $receiptPath,
                'status' => 'completed',
                'created_by' => auth()->id(), // Can be null if not authenticated
                'received_by' => auth()->id(), // Same as created_by for now
            ]);

            // Update invoice amounts
            $invoice->paid_amount += $request->amount;
            $invoice->balance = $invoice->total_amount - $invoice->paid_amount;
            
            // Update invoice status
            if ($invoice->balance <= 0) {
                $invoice->status = 'paid';
            } elseif ($invoice->paid_amount > 0) {
                $invoice->status = 'partial';
            }
            
            $invoice->save();

            DB::commit();

            return redirect()->back()->with('success', 'Payment recorded successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete uploaded file if transaction failed
            if ($receiptPath && Storage::disk('public')->exists($receiptPath)) {
                Storage::disk('public')->delete($receiptPath);
            }

            return redirect()->back()
                ->withErrors(['error' => 'Failed to record payment. Please try again.'])
                ->withInput();
        }
    }





    public function show(Payment $payment)
    {
        // Load payment with related data
        $paymentData = DB::table('payments')
            ->leftJoin('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->leftJoin('patients', 'invoices.patient_id', '=', 'patients.id')
            ->leftJoin('encounters', 'invoices.encounter_id', '=', 'encounters.id')
            ->select(
                'payments.*',
                DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, '')) as patient_name"),
                'encounters.encounter_number',
                'patients.phone',
                'patients.email',
                'invoices.total_amount',
                'invoices.paid_amount',
                'invoices.balance'
            )
            ->where('payments.id', $payment->id)
            ->first();

        if (!$paymentData) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        return response()->json([
            'payment' => [
                'id' => $paymentData->id,
                'invoice_id' => $paymentData->invoice_id,
                'amount' => (float) $paymentData->amount,
                'method' => $paymentData->method,
                'reference_no' => $paymentData->reference_no,
                'notes' => $paymentData->notes,
                'created_at' => $paymentData->created_at,
                'patient_name' => $paymentData->patient_name ?: 'Unknown Patient',
                'encounter_number' => $paymentData->encounter_number ?: 'N/A',
                'phone' => $paymentData->phone,
                'email' => $paymentData->email,
                'invoice_total' => (float) $paymentData->total_amount,
                'invoice_paid' => (float) $paymentData->paid_amount,
                'invoice_balance' => (float) $paymentData->balance
            ]
        ]);
    }

    public function downloadReceipt(Payment $payment)
    {
        // Generate a simple text receipt
        $paymentData = DB::table('payments')
            ->leftJoin('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->leftJoin('patients', 'invoices.patient_id', '=', 'patients.id')
            ->leftJoin('encounters', 'invoices.encounter_id', '=', 'encounters.id')
            ->select(
                'payments.*',
                DB::raw("CONCAT(COALESCE(patients.first_name, ''), ' ', COALESCE(patients.last_name, '')) as patient_name"),
                'encounters.encounter_number'
            )
            ->where('payments.id', $payment->id)
            ->first();

        if (!$paymentData) {
            abort(404, 'Payment not found');
        }

        $receiptContent = "MEDICARE HOSPITAL\n";
        $receiptContent .= "Payment Receipt\n";
        $receiptContent .= "================\n\n";
        $receiptContent .= "Receipt #: " . $paymentData->reference_no . "\n";
        $receiptContent .= "Date: " . date('Y-m-d H:i:s', strtotime($paymentData->created_at)) . "\n";
        $receiptContent .= "Patient: " . ($paymentData->patient_name ?: 'Unknown Patient') . "\n";
        $receiptContent .= "Encounter: " . ($paymentData->encounter_number ?: 'N/A') . "\n";
        $receiptContent .= "Invoice ID: " . $paymentData->invoice_id . "\n";
        $receiptContent .= "Payment Method: " . ucfirst($paymentData->method) . "\n";
        $receiptContent .= "Amount: KSh " . number_format($paymentData->amount, 2) . "\n";
        if ($paymentData->notes) {
            $receiptContent .= "Notes: " . $paymentData->notes . "\n";
        }
        $receiptContent .= "\nThank you for your payment!\n";

        return response($receiptContent)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', 'attachment; filename="payment_receipt_' . $paymentData->reference_no . '.txt"');
    }

    private function generateReferenceNumber($method)
    {
        $prefix = match($method) {
            'cash' => 'CASH',
            'card' => 'CARD',
            'mpesa' => 'MPSA',
            'bank' => 'BANK',
            default => 'PAY'
        };

        return $prefix . date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }
}