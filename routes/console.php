<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\ReleaseExpiredStockReservations;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule stock reservation cleanup job to run every 5 minutes
Schedule::job(new ReleaseExpiredStockReservations)->everyFiveMinutes();
