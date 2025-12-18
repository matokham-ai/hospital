<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Register cache observers for master data models
        \App\Models\Department::observe(\App\Observers\MasterDataCacheObserver::class);
        \App\Models\Ward::observe(\App\Observers\MasterDataCacheObserver::class);
        \App\Models\Bed::observe(\App\Observers\MasterDataCacheObserver::class);
        \App\Models\TestCatalog::observe(\App\Observers\MasterDataCacheObserver::class);
        \App\Models\DrugFormulary::observe(\App\Observers\MasterDataCacheObserver::class);
        
        // Register audit observers for master data models
        \App\Models\Department::observe(\App\Observers\MasterDataAuditObserver::class);
        \App\Models\Ward::observe(\App\Observers\MasterDataAuditObserver::class);
        \App\Models\Bed::observe(\App\Observers\MasterDataAuditObserver::class);
        \App\Models\TestCatalog::observe(\App\Observers\MasterDataAuditObserver::class);
        \App\Models\DrugFormulary::observe(\App\Observers\MasterDataAuditObserver::class);
        
        // Register payment observer to maintain invoice data integrity
        \App\Models\Payment::observe(\App\Observers\PaymentObserver::class);
    }
}
