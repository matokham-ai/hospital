<?php

namespace App\Listeners;

use App\Events\ConsultationCompleted;
use App\Services\BillingService;
use Illuminate\Support\Facades\Log;

class CreateConsultationBill
{
    protected $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function handle(ConsultationCompleted $event)
    {
        try {
            // 🧾 Debug log to confirm this listener fired
            Log::info('💰 Consultation billing triggered', [
                'encounter_id' => $event->encounterId,
                'physician_id' => $event->physicianId,
                'type' => $event->consultationType,
            ]);

            // 💳 Call the billing service
            $this->billingService->addConsultationCharge(
                $event->encounterId,
                $event->physicianId,
                $event->consultationType
            );

            Log::info('✅ Consultation billing successfully created', [
                'encounter_id' => $event->encounterId,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to create consultation bill: ' . $e->getMessage(), [
                'encounter_id' => $event->encounterId,
                'physician_id' => $event->physicianId,
                'consultation_type' => $event->consultationType,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
