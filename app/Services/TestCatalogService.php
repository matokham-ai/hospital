<?php

namespace App\Services;

use App\Models\TestCatalog;
use App\Models\Department;
use App\Services\MasterDataService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TestCatalogService
{
    protected MasterDataService $masterDataService;
    protected MasterDataCacheService $cacheService;

    public function __construct(MasterDataService $masterDataService, MasterDataCacheService $cacheService)
    {
        $this->masterDataService = $masterDataService;
        $this->cacheService = $cacheService;
    }

    /**
     * Get all test catalogs with optional filtering
     *
     * @param array $filters
     * @return Collection
     */
    public function getAllTests(array $filters = []): Collection
    {
        // Use cache service for simple cases
        if (empty($filters)) {
            return $this->cacheService->getTestCatalogs(false);
        }
        
        if (isset($filters['status']) && $filters['status'] === 'active' && count($filters) === 1) {
            return $this->cacheService->getTestCatalogs(true);
        }
        
        if (isset($filters['category']) && count($filters) === 1) {
            return $this->cacheService->getTestCatalogsByCategory($filters['category']);
        }

        // For complex filters, use direct query with caching
        $cacheKey = 'master_data.tests.filtered.' . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 1800, function () use ($filters) {
            $query = TestCatalog::with('department');

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['department_id'])) {
                $query->where('department_id', $filters['department_id']);
            }

            if (isset($filters['category'])) {
                $query->where('category', $filters['category']);
            }

            if (isset($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%");
                });
            }

            if (isset($filters['price_min'])) {
                $query->where('price', '>=', $filters['price_min']);
            }

            if (isset($filters['price_max'])) {
                $query->where('price', '<=', $filters['price_max']);
            }

            return $query->orderBy('category')
                        ->orderBy('name')
                        ->get();
        });
    }

    /**
     * Get active tests for dropdowns and references
     *
     * @return Collection
     */
    public function getActiveTests(): Collection
    {
        return Cache::remember('master_data.tests.active', 3600, function () {
            return TestCatalog::where('status', 'active')
                            ->orderBy('category')
                            ->orderBy('name')
                            ->get(['id', 'name', 'code', 'category', 'price', 'unit']);
        });
    }

    /**
     * Get tests grouped by category
     *
     * @return array
     */
    public function getTestsByCategory(): array
    {
        return Cache::remember('master_data.tests.by_category', 1800, function () {
            return TestCatalog::where('status', 'active')
                            ->orderBy('category')
                            ->orderBy('name')
                            ->get()
                            ->groupBy('category')
                            ->toArray();
        });
    }

    /**
     * Get available test categories
     *
     * @return array
     */
    public function getTestCategories(): array
    {
        return Cache::remember('master_data.tests.categories', 3600, function () {
            return TestCatalog::distinct()
                            ->pluck('category')
                            ->filter()
                            ->sort()
                            ->values()
                            ->toArray();
        });
    }

    /**
     * Create a new test catalog entry
     *
     * @param array $data
     * @return TestCatalog
     * @throws ValidationException
     */
    public function createTest(array $data): TestCatalog
    {
        // Validate test code uniqueness
        $this->validateTestCode($data['code']);

        // Validate department
        $this->validateDepartment($data['department_id']);

        // Validate pricing and TAT
        $this->validatePricingAndTAT($data);

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        DB::beginTransaction();

        try {
            $test = TestCatalog::create($data);

            $this->masterDataService->logMasterDataChange(
                'test_catalog',
                $test->id,
                'created',
                [],
                $test->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('test_catalog', $test->id);

            DB::commit();

            return $test;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing test catalog entry
     *
     * @param TestCatalog $test
     * @param array $data
     * @return TestCatalog
     * @throws ValidationException
     */
    public function updateTest(TestCatalog $test, array $data): TestCatalog
    {
        // Validate test code uniqueness if code is being changed
        if (isset($data['code']) && $data['code'] !== $test->code) {
            $this->validateTestCode($data['code']);
        }

        // Validate department if being changed
        if (isset($data['department_id']) && $data['department_id'] !== $test->department_id) {
            $this->validateDepartment($data['department_id']);
        }

        // Validate pricing and TAT if being changed
        if (isset($data['price']) || isset($data['turnaround_time'])) {
            $this->validatePricingAndTAT(array_merge($test->toArray(), $data));
        }

        // Check for pending orders before price changes
        if (isset($data['price']) && $data['price'] != $test->price) {
            $this->checkPendingOrders($test);
        }

        $oldValues = $test->toArray();

        DB::beginTransaction();

        try {
            $test->update($data);

            $this->masterDataService->logMasterDataChange(
                'test_catalog',
                $test->id,
                'updated',
                $oldValues,
                $test->fresh()->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('test_catalog', $test->id);

            DB::commit();

            return $test->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update test pricing with validation
     *
     * @param TestCatalog $test
     * @param float $newPrice
     * @return TestCatalog
     * @throws ValidationException
     */
    public function updateTestPrice(TestCatalog $test, float $newPrice): TestCatalog
    {
        if ($newPrice <= 0) {
            throw ValidationException::withMessages([
                'price' => 'Test price must be greater than 0'
            ]);
        }

        // Check for pending orders
        $this->checkPendingOrders($test);

        return $this->updateTest($test, ['price' => $newPrice]);
    }

    /**
     * Update turnaround time with validation
     *
     * @param TestCatalog $test
     * @param int $newTAT
     * @return TestCatalog
     * @throws ValidationException
     */
    public function updateTurnaroundTime(TestCatalog $test, int $newTAT): TestCatalog
    {
        if ($newTAT <= 0) {
            throw ValidationException::withMessages([
                'turnaround_time' => 'Turnaround time must be greater than 0 hours'
            ]);
        }

        return $this->updateTest($test, ['turnaround_time' => $newTAT]);
    }

    /**
     * Search tests with advanced filtering
     *
     * @param string $query
     * @param array $filters
     * @return Collection
     */
    public function searchTests(string $query, array $filters = []): Collection
    {
        $searchQuery = TestCatalog::with(['department', 'category']);

        // Text search
        if (!empty($query)) {
            $searchQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%")
                  ->orWhere('sample_type', 'like', "%{$query}%")
                  ->orWhereHas('category', function($q) use ($query) {
                      $q->where('name', 'like', "%{$query}%");
                  });
            });
        }

        // Apply filters - category filter by name
        if (isset($filters['category'])) {
            $searchQuery->whereHas('category', function($q) use ($filters) {
                if (is_array($filters['category'])) {
                    $q->whereIn('name', $filters['category']);
                } else {
                    $q->where('name', $filters['category']);
                }
            });
        }

        if (isset($filters['department_id'])) {
            $searchQuery->where('deptid', $filters['department_id']);
        }

        if (isset($filters['status'])) {
            $searchQuery->where('status', $filters['status']);
        } else {
            // Default to active tests only
            $searchQuery->where('status', 'active');
        }

        // Price range filters
        if (isset($filters['min_price'])) {
            $searchQuery->where('price', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price'])) {
            $searchQuery->where('price', '<=', $filters['max_price']);
        }

        // Support legacy price_range format
        if (isset($filters['price_range'])) {
            $range = $filters['price_range'];
            if (isset($range['min'])) {
                $searchQuery->where('price', '>=', $range['min']);
            }
            if (isset($range['max'])) {
                $searchQuery->where('price', '<=', $range['max']);
            }
        }

        // Turnaround time filters
        if (isset($filters['min_turnaround_time'])) {
            $searchQuery->where('turnaround_time', '>=', $filters['min_turnaround_time']);
        }
        if (isset($filters['max_turnaround_time'])) {
            $searchQuery->where('turnaround_time', '<=', $filters['max_turnaround_time']);
        }

        // Support legacy tat_range format
        if (isset($filters['tat_range'])) {
            $range = $filters['tat_range'];
            if (isset($range['min'])) {
                $searchQuery->where('turnaround_time', '>=', $range['min']);
            }
            if (isset($range['max'])) {
                $searchQuery->where('turnaround_time', '<=', $range['max']);
            }
        }

        return $searchQuery->orderBy('category_id')
                          ->orderBy('name')
                          ->get();
    }

    /**
     * Get test statistics
     *
     * @param array $filters
     * @return array
     */
    public function getTestStats(array $filters = []): array
    {
        $cacheKey = 'master_data.tests.stats';
        
        if (!empty($filters)) {
            $cacheKey .= '.' . md5(serialize($filters));
        }

        return Cache::remember($cacheKey, 1800, function () use ($filters) {
            $query = TestCatalog::query();

            // Apply filters if provided
            if (isset($filters['department_id'])) {
                $query->where('department_id', $filters['department_id']);
            }

            if (isset($filters['category'])) {
                $query->where('category', $filters['category']);
            }

            $stats = [
                'total_tests' => $query->count(),
                'active_tests' => $query->where('status', 'active')->count(),
                'inactive_tests' => $query->where('status', 'inactive')->count(),
                'categories_count' => $query->distinct()->count('category'),
                'avg_price' => round($query->where('status', 'active')->avg('price'), 2),
                'avg_turnaround_time' => round($query->where('status', 'active')->avg('turnaround_time'), 1),
                'price_range' => [
                    'min' => $query->where('status', 'active')->min('price'),
                    'max' => $query->where('status', 'active')->max('price'),
                ],
                'by_category' => $query->where('status', 'active')
                                     ->groupBy('category')
                                     ->selectRaw('category, count(*) as count')
                                     ->pluck('count', 'category')
                                     ->toArray(),
            ];

            return $stats;
        });
    }

    /**
     * Bulk update test prices
     *
     * @param array $priceUpdates Array of ['test_id' => id, 'price' => new_price]
     * @return array
     */
    public function bulkUpdatePrices(array $priceUpdates): array
    {
        $results = [];

        DB::beginTransaction();

        try {
            foreach ($priceUpdates as $update) {
                $test = TestCatalog::find($update['test_id']);
                
                if (!$test) {
                    $results[] = [
                        'test_id' => $update['test_id'],
                        'success' => false,
                        'error' => 'Test not found'
                    ];
                    continue;
                }

                // Validate price
                if ($update['price'] <= 0) {
                    $results[] = [
                        'test_id' => $update['test_id'],
                        'success' => false,
                        'error' => 'Price must be greater than 0'
                    ];
                    continue;
                }

                // Check for pending orders
                try {
                    $this->checkPendingOrders($test);
                } catch (ValidationException $e) {
                    $results[] = [
                        'test_id' => $update['test_id'],
                        'success' => false,
                        'error' => 'Has pending orders'
                    ];
                    continue;
                }

                $oldValues = $test->toArray();
                $test->update(['price' => $update['price']]);

                $this->masterDataService->logMasterDataChange(
                    'test_catalog',
                    $test->id,
                    'price_updated',
                    $oldValues,
                    $test->fresh()->toArray()
                );

                $results[] = [
                    'test_id' => $update['test_id'],
                    'success' => true
                ];
            }

            $this->masterDataService->invalidateRelatedCaches('test_catalog', 0);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    /**
     * Toggle test status
     *
     * @param TestCatalog $test
     * @return TestCatalog
     */
    public function toggleTestStatus(TestCatalog $test): TestCatalog
    {
        $newStatus = $test->status === 'active' ? 'inactive' : 'active';
        
        return $this->updateTest($test, ['status' => $newStatus]);
    }

    /**
     * Get tests by sample type
     *
     * @param string $sampleType
     * @return Collection
     */
    public function getTestsBySampleType(string $sampleType): Collection
    {
        return TestCatalog::where('sample_type', $sampleType)
                         ->where('status', 'active')
                         ->orderBy('name')
                         ->get();
    }

    /**
     * Validate test code uniqueness
     *
     * @param string $code
     * @param int|null $excludeId
     * @throws ValidationException
     */
    protected function validateTestCode(string $code, ?int $excludeId = null): void
    {
        $query = TestCatalog::where('code', $code);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'code' => 'Test code must be unique. This code is already in use.'
            ]);
        }
    }

    /**
     * Validate department exists and is active
     *
     * @param int $departmentId
     * @throws ValidationException
     */
    protected function validateDepartment(int $departmentId): void
    {
        $department = Department::find($departmentId);
        
        if (!$department) {
            throw ValidationException::withMessages([
                'department_id' => 'Department not found'
            ]);
        }

        if ($department->status !== 'active') {
            throw ValidationException::withMessages([
                'department_id' => 'Cannot assign test to inactive department'
            ]);
        }
    }

    /**
     * Validate pricing and turnaround time
     *
     * @param array $data
     * @throws ValidationException
     */
    protected function validatePricingAndTAT(array $data): void
    {
        if (isset($data['price']) && $data['price'] <= 0) {
            throw ValidationException::withMessages([
                'price' => 'Test price must be greater than 0'
            ]);
        }

        if (isset($data['turnaround_time']) && $data['turnaround_time'] <= 0) {
            throw ValidationException::withMessages([
                'turnaround_time' => 'Turnaround time must be greater than 0 hours'
            ]);
        }

        // Validate reasonable ranges
        if (isset($data['price']) && $data['price'] > 100000) {
            throw ValidationException::withMessages([
                'price' => 'Test price seems unusually high. Please verify.'
            ]);
        }

        if (isset($data['turnaround_time']) && $data['turnaround_time'] > 720) { // 30 days
            throw ValidationException::withMessages([
                'turnaround_time' => 'Turnaround time seems unusually long. Please verify.'
            ]);
        }
    }

    /**
     * Check for pending orders before price changes
     *
     * @param TestCatalog $test
     * @return int Number of pending orders
     */
    public function hasPendingOrders(TestCatalog $test): int
    {
        // This would check for pending lab orders when that system is implemented
        // For now, return 0 as no orders system exists yet
        
        // Example implementation when orders system exists:
        // return $test->labOrders()->whereIn('status', ['pending', 'in_progress'])->count();
        
        return 0;
    }



    /**
     * Import tests from CSV/Excel file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    public function importFromCsv($file): array
    {
        try {
            $import = new \App\Imports\TestCatalogImport();
            
            DB::beginTransaction();
            
            \Maatwebsite\Excel\Facades\Excel::import($import, $file);
            
            // Log the import operation
            $this->masterDataService->logMasterDataChange(
                'test_catalog',
                0,
                'bulk_imported',
                [],
                [
                    'imported_count' => $import->getImportedCount(),
                    'skipped_count' => $import->getSkippedCount(),
                    'file_name' => $file->getClientOriginalName()
                ]
            );

            // Invalidate test catalog caches
            $this->masterDataService->invalidateRelatedCaches('test_catalog', 0);
            
            DB::commit();

            return [
                'imported' => $import->getImportedCount(),
                'skipped' => $import->getSkippedCount(),
                'errors' => collect($import->failures())->map(function ($failure) {
                    return "Row {$failure->row()}: " . implode(', ', $failure->errors());
                })->toArray(),
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Check for pending orders before price changes (protected method)
     *
     * @param TestCatalog $test
     * @throws ValidationException
     */
    protected function checkPendingOrders(TestCatalog $test): void
    {
        $pendingCount = $this->hasPendingOrders($test);
        
        if ($pendingCount > 0) {
            throw ValidationException::withMessages([
                'price' => "Cannot change price. Test has {$pendingCount} pending orders."
            ]);
        }
    }
}