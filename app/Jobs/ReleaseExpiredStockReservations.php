<?php

namespace App\Jobs;

use App\Models\Prescription;
use App\Services\PrescriptionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ReleaseExpiredStockReservations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     * 
     * This job releases stock reservations that have expired (older than 30 minutes).
     * It runs every 5 minutes to ensure timely release of reserved stock.
     */
    public function handle(PrescriptionService $prescriptionService): void
    {
        try {
            // Find all prescriptions with expired stock reservations
            $expiredReservations = Prescription::where('stock_reserved', true)
                ->whereNotNull('stock_reserved_at')
                ->where('stock_reserved_at', '<=', now()->subMinutes(30))
                ->get();

            $releasedCount = 0;

            foreach ($expiredReservations as $prescription) {
                try {
                    // Release the stock
                    $prescriptionService->releaseStock($prescription);
                    
                    // Log the release
                    Log::info('Released expired stock reservation', [
                        'prescription_id' => $prescription->id,
                        'drug_id' => $prescription->drug_id,
                        'quantity' => $prescription->quantity,
                        'reserved_at' => $prescription->stock_reserved_at,
                        'released_at' => now(),
                    ]);
                    
                    $releasedCount++;
                } catch (\Exception $e) {
                    // Log individual failures but continue processing
                    Log::error('Failed to release expired stock reservation', [
                        'prescription_id' => $prescription->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($releasedCount > 0) {
                Log::info("Released {$releasedCount} expired stock reservations");
            }
        } catch (\Exception $e) {
            Log::error('Stock reservation cleanup job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }
}
