<?php

namespace App\Listeners;

use App\Events\LabTestOrdered;
use App\Services\BillingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateLabTestBill
{
    protected $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function handle(LabTestOrdered $event)
    {
        try {
            $this->billingService->addLabTestCharge(
                $event->encounterId,
                $event->testId,
                $event->testName,
                $event->testPrice
            );
        } catch (\Exception $e) {
            // Log the error but don't fail the lab test order
            \Log::error('Failed to create lab test bill: ' . $e->getMessage(), [
                'encounter_id' => $event->encounterId,
                'test_id' => $event->testId,
                'test_name' => $event->testName,
                'test_price' => $event->testPrice,
            ]);
        }
    }
}