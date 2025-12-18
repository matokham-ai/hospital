<?php

namespace App\Listeners;

use App\Events\ConsultationCompleted;
use App\Services\BillingService;
use Illuminate\Contracts\Queue\ShouldQueue;

class AddConsultationCharge implements ShouldQueue
{
    public function __construct(
        private BillingService $billingService
    ) {}

    public function handle(ConsultationCompleted $event): void
    {
        $encounter = $event->encounter;
        
        // Check if consultation charge already exists
        $existingCharge = $encounter->billingAccount?->items()
            ->where('item_type', 'consultation')
            ->exists();
            
        if (!$existingCharge) {
            $this->billingService->addConsultationCharge($encounter);
        }
    }
}