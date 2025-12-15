<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Encounter;
use App\Models\LabOrder;
use App\Models\ServiceCatalogue;
use App\Services\BillingService;
use Illuminate\Http\Request;

class BillingTestController extends Controller
{
    public function __construct(
        private BillingService $billingService
    ) {}

    /**
     * Test the billing system with sample data
     */
    public function testBilling(Request $request)
    {
        try {
            // Find or create a test encounter
            $encounter = Encounter::with(['patient', 'department'])->first();
            
            if (!$encounter) {
                return response()->json([
                    'error' => 'No encounters found. Please create a patient encounter first.'
                ], 404);
            }

            // Get or create billing account
            $billingAccount = $this->billingService->getOrCreateBillingAccount($encounter);

            // Add consultation charge
            $consultationCharge = $this->billingService->addConsultationCharge($encounter);

            // Add some consumables
            $consumables = [
                ['name' => 'IV Cannula 18G', 'quantity' => 2, 'unit_price' => 300],
                ['name' => 'Syringe 5ml', 'quantity' => 5, 'unit_price' => 50],
                ['name' => 'Surgical Gloves', 'quantity' => 3, 'unit_price' => 100],
            ];
            
            $consumableCharges = $this->billingService->addMultipleConsumables($encounter, $consumables);

            // Create a lab order (this should automatically add billing)
            $labOrder = LabOrder::create([
                'encounter_id' => $encounter->id,
                'patient_id' => $encounter->patient_id,
                'ordered_by' => 1, // Assuming physician ID 1 exists
                'test_name' => 'Full Blood Count',
                'status' => 'pending'
            ]);

            // Get running bill
            $runningBill = $this->billingService->getRunningBill($encounter);

            return response()->json([
                'success' => true,
                'message' => 'Billing test completed successfully',
                'data' => [
                    'encounter' => [
                        'id' => $encounter->id,
                        'encounter_number' => $encounter->encounter_number,
                        'patient_name' => $encounter->patient->first_name . ' ' . $encounter->patient->last_name,
                        'department' => $encounter->department->name ?? 'Unknown',
                    ],
                    'billing_account' => [
                        'id' => $billingAccount->id,
                        'account_no' => $billingAccount->account_no,
                        'status' => $billingAccount->status,
                    ],
                    'charges_added' => [
                        'consultation' => [
                            'id' => $consultationCharge->id,
                            'description' => $consultationCharge->description,
                            'amount' => $consultationCharge->amount,
                        ],
                        'consumables' => array_map(function($charge) {
                            return [
                                'id' => $charge->id,
                                'description' => $charge->description,
                                'quantity' => $charge->quantity,
                                'unit_price' => $charge->unit_price,
                                'amount' => $charge->amount,
                            ];
                        }, $consumableCharges),
                        'lab_order' => [
                            'id' => $labOrder->id,
                            'test_name' => $labOrder->test_name,
                            'status' => $labOrder->status,
                        ]
                    ],
                    'running_bill' => $runningBill,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Billing test failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Get service catalogue
     */
    public function getServiceCatalogue()
    {
        $services = ServiceCatalogue::active()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }

    /**
     * Test payment processing
     */
    public function testPayment(Request $request)
    {
        $request->validate([
            'encounter_id' => 'required|exists:encounters,id',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|string',
        ]);

        try {
            $encounter = Encounter::findOrFail($request->encounter_id);
            $billingAccount = $encounter->billingAccount;

            if (!$billingAccount) {
                return response()->json([
                    'error' => 'No billing account found for this encounter'
                ], 404);
            }

            $payment = $billingAccount->addPayment(
                $request->amount,
                $request->method,
                $request->reference_no ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment processed successfully',
                'data' => [
                    'payment' => [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'method' => $payment->method,
                        'reference_no' => $payment->reference_no,
                    ],
                    'billing_account' => [
                        'total_amount' => $billingAccount->fresh()->total_amount,
                        'amount_paid' => $billingAccount->fresh()->amount_paid,
                        'balance' => $billingAccount->fresh()->balance,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Payment processing failed: ' . $e->getMessage()
            ], 500);
        }
    }
}