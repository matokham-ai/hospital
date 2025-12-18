<?php

namespace App\Observers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class PaymentObserver
{
    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment): void
    {
        $this->updateInvoiceAmounts($payment->invoice_id);
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment): void
    {
        $this->updateInvoiceAmounts($payment->invoice_id);
        
        // If invoice_id changed, update the old invoice too
        if ($payment->isDirty('invoice_id')) {
            $originalInvoiceId = $payment->getOriginal('invoice_id');
            if ($originalInvoiceId) {
                $this->updateInvoiceAmounts($originalInvoiceId);
            }
        }
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment): void
    {
        $this->updateInvoiceAmounts($payment->invoice_id);
    }

    /**
     * Update invoice paid amount and balance based on actual payments
     */
    private function updateInvoiceAmounts(int $invoiceId): void
    {
        $invoice = Invoice::find($invoiceId);
        if (!$invoice) {
            return;
        }

        // Calculate total payments for this invoice
        $totalPayments = Payment::where('invoice_id', $invoiceId)->sum('amount');
        
        // Update invoice amounts
        $invoice->paid_amount = $totalPayments;
        $invoice->balance = $invoice->total_amount - $totalPayments;
        
        // Update status based on balance
        if ($invoice->balance <= 0) {
            $invoice->status = 'paid';
        } elseif ($invoice->paid_amount > 0) {
            $invoice->status = 'partial';
        } else {
            $invoice->status = 'unpaid';
        }
        
        $invoice->save();
    }
}