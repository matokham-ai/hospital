<?php

namespace App\Listeners;

use App\Events\PatientAdmitted;
use App\Services\BillingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateAdmissionBill
{
    protected $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function handle(PatientAdmitted $event)
    {
        try {
            // Add initial bed charge for 1 day (can be updated later)
            $this->billingService->addBedCharge(
                $event->encounterId,
                $event->bedId,
                1, // Initial 1 day
                $event->bedType
            );
        } catch (\Exception $e) {
            // Log the error but don't fail the admission
            \Log::error('Failed to create admission bill: ' . $e->getMessage(), [
                'encounter_id' => $event->encounterId,
                'bed_id' => $event->bedId,
                'bed_type' => $event->bedType,
            ]);
        }
    }
}