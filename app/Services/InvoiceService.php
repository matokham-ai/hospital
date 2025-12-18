<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\BillingAccount;
use App\Models\BillingItem;
use Illuminate\Support\Facades\Log;

class InvoiceService
{
    /**
     * Generate invoice from billing account
     */
    public function generateInvoiceFromBillingAccount($encounterId, $patientId = null)
    {
        try {
            // Check if invoice already exists
            $existingInvoice = Invoice::where('encounter_id', $encounterId)->first();
            if ($existingInvoice) {
                Log::info('Invoice already exists', [
                    'encounter_id' => $encounterId,
                    'invoice_id' => $existingInvoice->id
                ]);
                return $existingInvoice;
            }

            // Get billing account
            $billingAccount = BillingAccount::where('encounter_id', $encounterId)->first();
            if (!$billingAccount) {
                throw new \Exception("No billing account found for encounter {$encounterId}");
            }

            // Use patient ID from billing account if not provided
            $patientId = $patientId ?? $billingAccount->patient_id;

            // Check if there are billing items
            $billingItemsCount = BillingItem::where('encounter_id', $encounterId)->count();
            if ($billingItemsCount === 0) {
                throw new \Exception("No billing items found for encounter {$encounterId}");
            }

            // Create invoice from billing account data
            $invoiceData = [
                'encounter_id' => $encounterId,
                'patient_id' => $patientId,
                'total_amount' => $billingAccount->total_amount,
                'discount' => $billingAccount->discount_amount ?? 0,
                'net_amount' => $billingAccount->net_amount,
                'paid_amount' => $billingAccount->amount_paid ?? 0,
                'balance' => $billingAccount->balance,
                'status' => $this->determineInvoiceStatus($billingAccount->balance, $billingAccount->amount_paid),
            ];

            $invoice = Invoice::create($invoiceData);

            Log::info('Invoice generated successfully', [
                'encounter_id' => $encounterId,
                'invoice_id' => $invoice->id,
                'total_amount' => $invoice->total_amount,
                'billing_items_count' => $billingItemsCount
            ]);

            return $invoice;

        } catch (\Exception $e) {
            Log::error('Failed to generate invoice', [
                'encounter_id' => $encounterId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Generate invoices for all billing accounts without invoices
     */
    public function generateMissingInvoices()
    {
        $billingAccountsWithoutInvoices = BillingAccount::whereNotIn('encounter_id', function($query) {
            $query->select('encounter_id')->from('invoices');
        })
        ->where('total_amount', '>', 0)
        ->get();

        $generated = 0;
        $errors = 0;

        foreach ($billingAccountsWithoutInvoices as $account) {
            try {
                $this->generateInvoiceFromBillingAccount($account->encounter_id, $account->patient_id);
                $generated++;
            } catch (\Exception $e) {
                $errors++;
                Log::error('Failed to generate invoice for billing account', [
                    'billing_account_id' => $account->id,
                    'encounter_id' => $account->encounter_id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        Log::info('Bulk invoice generation completed', [
            'total_accounts' => $billingAccountsWithoutInvoices->count(),
            'generated' => $generated,
            'errors' => $errors
        ]);

        return [
            'total_accounts' => $billingAccountsWithoutInvoices->count(),
            'generated' => $generated,
            'errors' => $errors
        ];
    }

    /**
     * Determine invoice status based on balance and payments
     */
    private function determineInvoiceStatus($balance, $amountPaid)
    {
        if ($balance <= 0) {
            return 'paid';
        } elseif ($amountPaid > 0) {
            return 'partial';
        } else {
            return 'unpaid';
        }
    }

    /**
     * Update invoice when billing account changes
     */
    public function updateInvoiceFromBillingAccount($encounterId)
    {
        try {
            $invoice = Invoice::where('encounter_id', $encounterId)->first();
            if (!$invoice) {
                Log::info('No invoice found to update', ['encounter_id' => $encounterId]);
                return null;
            }

            $billingAccount = BillingAccount::where('encounter_id', $encounterId)->first();
            if (!$billingAccount) {
                Log::warning('No billing account found for invoice update', ['encounter_id' => $encounterId]);
                return null;
            }

            $invoice->update([
                'total_amount' => $billingAccount->total_amount,
                'discount' => $billingAccount->discount_amount ?? 0,
                'net_amount' => $billingAccount->net_amount,
                'paid_amount' => $billingAccount->amount_paid ?? 0,
                'balance' => $billingAccount->balance,
                'status' => $this->determineInvoiceStatus($billingAccount->balance, $billingAccount->amount_paid),
            ]);

            Log::info('Invoice updated successfully', [
                'encounter_id' => $encounterId,
                'invoice_id' => $invoice->id,
                'new_total' => $invoice->total_amount
            ]);

            return $invoice;

        } catch (\Exception $e) {
            Log::error('Failed to update invoice', [
                'encounter_id' => $encounterId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}