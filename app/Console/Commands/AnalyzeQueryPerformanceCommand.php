<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\QueryOptimizationService;
use App\Services\MasterDataCacheService;

class AnalyzeQueryPerformanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'master-data:analyze-performance {--queries=10 : Number of test queries to run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze query performance for master data operations';

    protected QueryOptimizationService $queryService;
    protected MasterDataCacheService $cacheService;

    public function __construct(QueryOptimizationService $queryService, MasterDataCacheService $cacheService)
    {
        parent::__construct();
        $this->queryService = $queryService;
        $this->cacheService = $cacheService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Analyzing Master Data Query Performance');
        $this->line('==========================================');

        $queries = (int) $this->option('queries');
        
        // Enable query logging
        DB::enableQueryLog();
        
        $results = [];
        
        // Test 1: Dashboard stats
        $results[] = $this->testQuery('Dashboard Stats (Optimized)', function () {
            return $this->queryService->getDashboardStatsOptimized();
        });
        
        $results[] = $this->testQuery('Dashboard Stats (Cached)', function () {
            return $this->cacheService->getMasterDataStats();
        });
        
        // Test 2: Wards with beds
        $results[] = $this->testQuery('Wards with Beds (Optimized)', function () {
            return $this->queryService->getWardsWithBedsOptimized();
        });
        
        $results[] = $this->testQuery('Wards with Beds (Cached)', function () {
            return $this->cacheService->getWardsWithBeds();
        });
        
        // Test 3: Test catalogs
        $results[] = $this->testQuery('Test Catalogs (Optimized)', function () {
            return $this->queryService->getTestCatalogsOptimized(['status' => 'active']);
        });
        
        $results[] = $this->testQuery('Test Catalogs (Cached)', function () {
            return $this->cacheService->getTestCatalogs(true);
        });
        
        // Test 4: Drug formulary
        $results[] = $this->testQuery('Drug Formulary (Optimized)', function () {
            return $this->queryService->getDrugFormularyOptimized(['status' => 'active']);
        });
        
        $results[] = $this->testQuery('Drug Formulary (Cached)', function () {
            return $this->cacheService->getDrugFormulary(true);
        });
        
        // Test 5: Global search
        $results[] = $this->testQuery('Global Search', function () {
            return $this->queryService->globalSearch('test', 20);
        });
        
        // Test 6: Bed occupancy matrix
        $results[] = $this->testQuery('Bed Occupancy Matrix', function () {
            return $this->queryService->getBedOccupancyMatrix();
        });
        
        // Display results
        $this->displayResults($results);
        
        // Show query analysis
        $this->analyzeQueries();
        
        return 0;
    }
    
    /**
     * Test a query and measure performance
     */
    protected function testQuery(string $name, callable $query): array
    {
        $startTime = microtime(true);
        $startQueries = count(DB::getQueryLog());
        
        // Run the query multiple times for better average
        $iterations = 3;
        for ($i = 0; $i < $iterations; $i++) {
            $result = $query();
        }
        
        $endTime = microtime(true);
        $endQueries = count(DB::getQueryLog());
        
        $executionTime = ($endTime - $startTime) / $iterations * 1000; // Convert to milliseconds
        $queryCount = ($endQueries - $startQueries) / $iterations;
        
        return [
            'name' => $name,
            'execution_time' => round($executionTime, 2),
            'query_count' => $queryCount,
            'result_count' => is_countable($result) ? count($result) : (is_array($result) ? count($result) : 1)
        ];
    }
    
    /**
     * Display performance results
     */
    protected function displayResults(array $results): void
    {
        $this->line('');
        $this->info('Performance Test Results:');
        $this->line('========================');
        
        $headers = ['Query', 'Execution Time (ms)', 'Query Count', 'Result Count'];
        $rows = [];
        
        foreach ($results as $result) {
            $rows[] = [
                $result['name'],
                $result['execution_time'] . ' ms',
                $result['query_count'],
                $result['result_count']
            ];
        }
        
        $this->table($headers, $rows);
        
        // Calculate averages
        $avgTime = array_sum(array_column($results, 'execution_time')) / count($results);
        $avgQueries = array_sum(array_column($results, 'query_count')) / count($results);
        
        $this->line('');
        $this->info("Average Execution Time: " . round($avgTime, 2) . " ms");
        $this->info("Average Query Count: " . round($avgQueries, 2));
    }
    
    /**
     * Analyze executed queries
     */
    protected function analyzeQueries(): void
    {
        $queries = DB::getQueryLog();
        
        $this->line('');
        $this->info('Query Analysis:');
        $this->line('===============');
        
        // Group queries by type
        $queryTypes = [];
        $slowQueries = [];
        
        foreach ($queries as $query) {
            $sql = $query['query'];
            $time = $query['time'];
            
            // Determine query type
            if (strpos($sql, 'SELECT') === 0) {
                $type = 'SELECT';
            } elseif (strpos($sql, 'INSERT') === 0) {
                $type = 'INSERT';
            } elseif (strpos($sql, 'UPDATE') === 0) {
                $type = 'UPDATE';
            } elseif (strpos($sql, 'DELETE') === 0) {
                $type = 'DELETE';
            } else {
                $type = 'OTHER';
            }
            
            if (!isset($queryTypes[$type])) {
                $queryTypes[$type] = ['count' => 0, 'total_time' => 0];
            }
            
            $queryTypes[$type]['count']++;
            $queryTypes[$type]['total_time'] += $time;
            
            // Track slow queries (> 100ms)
            if ($time > 100) {
                $slowQueries[] = [
                    'sql' => substr($sql, 0, 100) . '...',
                    'time' => $time,
                    'bindings' => json_encode($query['bindings'])
                ];
            }
        }
        
        // Display query type summary
        $this->info("Total Queries Executed: " . count($queries));
        
        foreach ($queryTypes as $type => $stats) {
            $avgTime = $stats['total_time'] / $stats['count'];
            $this->line("{$type}: {$stats['count']} queries, avg {$avgTime}ms");
        }
        
        // Display slow queries
        if (!empty($slowQueries)) {
            $this->line('');
            $this->warn('Slow Queries (>100ms):');
            foreach ($slowQueries as $slowQuery) {
                $this->line("• {$slowQuery['time']}ms: {$slowQuery['sql']}");
            }
        } else {
            $this->line('');
            $this->info('✅ No slow queries detected');
        }
        
        // Recommendations
        $this->line('');
        $this->info('Performance Recommendations:');
        $this->line('============================');
        
        if (count($queries) > 50) {
            $this->warn('• High query count detected. Consider using more caching.');
        }
        
        if (!empty($slowQueries)) {
            $this->warn('• Slow queries detected. Review indexes and query optimization.');
        }
        
        $selectQueries = $queryTypes['SELECT']['count'] ?? 0;
        if ($selectQueries > 30) {
            $this->warn('• Many SELECT queries. Consider eager loading relationships.');
        }
        
        $this->info('• Use Redis caching for frequently accessed data');
        $this->info('• Implement query result caching for complex operations');
        $this->info('• Monitor query performance in production');
    }
}