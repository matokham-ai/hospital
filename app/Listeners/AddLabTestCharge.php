<?php

namespace App\Listeners;

use App\Events\LabOrderCreated;
use App\Services\BillingService;
use Illuminate\Contracts\Queue\ShouldQueue;

class AddLabTestCharge implements ShouldQueue
{
    public function __construct(
        private BillingService $billingService
    ) {}

    public function handle(LabOrderCreated $event): void
    {
        $labOrder = $event->labOrder;
        
        // Only add charge if encounter exists and is active
        if ($labOrder->encounter && $labOrder->encounter->status !== 'discharged') {
            $this->billingService->addLabTestCharge(
                $labOrder->encounter_id,
                $labOrder->test_id,
                $labOrder->test_name
            );
        }
    }
}