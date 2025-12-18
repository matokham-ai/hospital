<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MasterDataCacheService;

class MasterDataCacheCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'master-data:cache {action : The action to perform (clear|warm|stats)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage master data caches (clear, warm up, or show stats)';

    protected MasterDataCacheService $cacheService;

    public function __construct(MasterDataCacheService $cacheService)
    {
        parent::__construct();
        $this->cacheService = $cacheService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');

        switch ($action) {
            case 'clear':
                return $this->clearCaches();
            case 'warm':
                return $this->warmUpCaches();
            case 'stats':
                return $this->showStats();
            default:
                $this->error("Unknown action: {$action}");
                $this->info('Available actions: clear, warm, stats');
                return 1;
        }
    }

    /**
     * Clear all master data caches
     */
    protected function clearCaches(): int
    {
        $this->info('Clearing master data caches...');
        
        try {
            $this->cacheService->clearAllCaches();
            $this->info('✅ Master data caches cleared successfully');
            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Failed to clear caches: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Warm up master data caches
     */
    protected function warmUpCaches(): int
    {
        $this->info('Warming up master data caches...');
        
        try {
            $this->cacheService->warmUpCaches();
            $this->info('✅ Master data caches warmed up successfully');
            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Failed to warm up caches: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Show cache statistics
     */
    protected function showStats(): int
    {
        $this->info('Master Data Cache Statistics');
        $this->line('================================');
        
        try {
            $stats = $this->cacheService->getMasterDataStats();
            
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Active Departments', $stats['departments']],
                    ['Active Wards', $stats['wards']],
                    ['Total Beds', $stats['beds']],
                    ['Available Beds', $stats['available_beds']],
                    ['Occupied Beds', $stats['occupied_beds']],
                    ['Active Tests', $stats['tests']],
                    ['Active Drugs', $stats['drugs']],
                ]
            );
            
            $occupancyRate = $stats['beds'] > 0 
                ? round(($stats['occupied_beds'] / $stats['beds']) * 100, 1) 
                : 0;
            
            $this->line('');
            $this->info("Bed Occupancy Rate: {$occupancyRate}%");
            
            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Failed to get stats: {$e->getMessage()}");
            return 1;
        }
    }
}