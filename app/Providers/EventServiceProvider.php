<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        \App\Events\LabOrderCreated::class => [
            \App\Listeners\AddLabTestCharge::class,
        ],
        \App\Events\ConsultationCompleted::class => [
           // \App\Listeners\AddConsultationCharge::class,
            \App\Listeners\CreateConsultationBill::class,
        ],
        \App\Events\PatientAdmitted::class => [
            \App\Listeners\CreateAdmissionBill::class,
        ],
        \App\Events\LabTestOrdered::class => [
            \App\Listeners\CreateLabTestBill::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }
}
