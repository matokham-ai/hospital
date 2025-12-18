<?php

namespace App\Console\Commands;

use App\Jobs\ReleaseExpiredStockReservations;
use Illuminate\Console\Command;

class ReleaseExpiredStockReservationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:release-expired-reservations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Release expired stock reservations (older than 30 minutes)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Releasing expired stock reservations...');
        
        // Dispatch the job
        ReleaseExpiredStockReservations::dispatch();
        
        $this->info('Stock reservation cleanup job dispatched successfully.');
        
        return Command::SUCCESS;
    }
}
