<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\Department;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Models\Ward;
use App\Models\Bed;

class MasterDataCacheService
{
    private const CACHE_TTL = 3600; // 1 hour
    private const CACHE_PREFIX = 'master_data:';
    
    // Cache keys
    private const DEPARTMENTS_KEY = self::CACHE_PREFIX . 'departments';
    private const ACTIVE_DEPARTMENTS_KEY = self::CACHE_PREFIX . 'departments:active';
    private const TEST_CATALOGS_KEY = self::CACHE_PREFIX . 'test_catalogs';
    private const ACTIVE_TEST_CATALOGS_KEY = self::CACHE_PREFIX . 'test_catalogs:active';
    private const DRUG_FORMULARY_KEY = self::CACHE_PREFIX . 'drug_formulary';
    private const ACTIVE_DRUG_FORMULARY_KEY = self::CACHE_PREFIX . 'drug_formulary:active';
    private const WARDS_KEY = self::CACHE_PREFIX . 'wards';
    private const BEDS_KEY = self::CACHE_PREFIX . 'beds';
    private const WARD_BEDS_KEY = self::CACHE_PREFIX . 'ward_beds:';
    
    /**
     * Get all departments with caching
     */
    public function getDepartments(bool $activeOnly = false): \Illuminate\Database\Eloquent\Collection
    {
        $key = $activeOnly ? self::ACTIVE_DEPARTMENTS_KEY : self::DEPARTMENTS_KEY;
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($activeOnly) {
            $query = Department::orderBy('name');
            
            if ($activeOnly) {
                $query->where('status', 'active');
            }
            
            return $query->get();
        });
    }
    
    /**
     * Get specific department with caching
     */
    public function getDepartment($deptid): ?Department
    {
        $key = self::CACHE_PREFIX . "department:{$deptid}";
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($deptid) {
            return Department::where('deptid', $deptid)->first();
        });
    }
    
    /**
     * Get all test catalogs with caching
     */
    public function getTestCatalogs(bool $activeOnly = false): \Illuminate\Database\Eloquent\Collection
    {
        $key = $activeOnly ? self::ACTIVE_TEST_CATALOGS_KEY : self::TEST_CATALOGS_KEY;
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($activeOnly) {
            $query = TestCatalog::with(['department', 'category'])
                ->orderBy('category_id')
                ->orderBy('name');
            
            if ($activeOnly) {
                $query->where('status', 'active');
            }
            
            return $query->get();
        });
    }
    
    /**
     * Get test catalogs by category with caching
     */
    public function getTestCatalogsByCategory(string $category): \Illuminate\Database\Eloquent\Collection
    {
        $key = self::CACHE_PREFIX . "test_catalogs:category:{$category}";
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($category) {
            return TestCatalog::with(['department', 'category'])
                ->where('category_id', $category)
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        });
    }
    
    /**
     * Get specific test catalog with caching
     */
    public function getTestCatalog(int $id): ?TestCatalog
    {
        $key = self::CACHE_PREFIX . "test_catalog:{$id}";
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($id) {
            return TestCatalog::with(['department'])->find($id);
        });
    }
    
    /**
     * Get all drug formulary with caching
     */
    public function getDrugFormulary(bool $activeOnly = false): \Illuminate\Database\Eloquent\Collection
    {
        $key = $activeOnly ? self::ACTIVE_DRUG_FORMULARY_KEY : self::DRUG_FORMULARY_KEY;
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($activeOnly) {
            $query = DrugFormulary::with(['substitutes'])
                ->orderBy('name');
            
            if ($activeOnly) {
                $query->where('status', 'active');
            }
            
            return $query->get();
        });
    }
    
    /**
     * Get specific drug with caching
     */
    public function getDrug(int $id): ?DrugFormulary
    {
        $key = self::CACHE_PREFIX . "drug:{$id}";
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($id) {
            return DrugFormulary::with(['substitutes'])->find($id);
        });
    }
    
    /**
     * Get drugs by ATC code with caching
     */
    public function getDrugsByAtcCode(string $atcCode): \Illuminate\Database\Eloquent\Collection
    {
        $key = self::CACHE_PREFIX . "drugs:atc:{$atcCode}";
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($atcCode) {
            return DrugFormulary::where('atc_code', 'like', $atcCode . '%')
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        });
    }
    
    /**
     * Get all wards with beds
     */
    public function getWardsWithBeds(): \Illuminate\Database\Eloquent\Collection
    {
        return Cache::remember(self::WARDS_KEY, self::CACHE_TTL, function () {
            return Ward::with(['beds', 'department'])
                ->orderBy('name')
                ->get();
        });
    }
    
    /**
     * Get beds for specific ward
     */
    public function getWardBeds(int $wardId): \Illuminate\Database\Eloquent\Collection
    {
        $key = self::WARD_BEDS_KEY . $wardId;
        
        return Cache::remember($key, self::CACHE_TTL, function () use ($wardId) {
            return Bed::where('ward_id', $wardId)
                ->orderBy('bed_number')
                ->get();
        });
    }
    
    /**
     * Get master data statistics for dashboard
     */
    public function getMasterDataStats(): array
    {
        $key = self::CACHE_PREFIX . 'stats';
        
        return Cache::remember($key, 300, function () { // 5 minutes cache for stats
            return [
                'departments' => Department::where('status', 'active')->count(),
                'wards' => Ward::where('status', 'active')->count(),
                'beds' => Bed::where('status', 'active')->count(),
                'tests' => TestCatalog::where('status', 'active')->count(),
                'drugs' => DrugFormulary::where('status', 'active')->count(),
                'occupied_beds' => Bed::where('status', 'OCCUPIED')->count(),
                'available_beds' => Bed::where('status', 'AVAILABLE')->count(),
            ];
        });
    }
    
    /**
     * Invalidate department-related caches
     */
    public function invalidateDepartmentCaches($departmentId = null): void
    {
        $keys = [
            self::DEPARTMENTS_KEY,
            self::ACTIVE_DEPARTMENTS_KEY,
            self::CACHE_PREFIX . 'stats',
        ];
        
        if ($departmentId) {
            $keys[] = self::CACHE_PREFIX . "department:{$departmentId}";
        }
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        
        Log::info('Department caches invalidated', ['department_id' => $departmentId]);
    }
    
    /**
     * Invalidate test catalog-related caches
     */
    public function invalidateTestCatalogCaches(int $testId = null, string $category = null): void
    {
        $keys = [
            self::TEST_CATALOGS_KEY,
            self::ACTIVE_TEST_CATALOGS_KEY,
            self::CACHE_PREFIX . 'stats',
        ];
        
        if ($testId) {
            $keys[] = self::CACHE_PREFIX . "test_catalog:{$testId}";
        }
        
        if ($category) {
            $keys[] = self::CACHE_PREFIX . "test_catalogs:category:{$category}";
        }
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        
        Log::info('Test catalog caches invalidated', [
            'test_id' => $testId,
            'category' => $category
        ]);
    }
    
    /**
     * Invalidate drug formulary-related caches
     */
    public function invalidateDrugFormularyCaches(int $drugId = null, string $atcCode = null): void
    {
        $keys = [
            self::DRUG_FORMULARY_KEY,
            self::ACTIVE_DRUG_FORMULARY_KEY,
            self::CACHE_PREFIX . 'stats',
        ];
        
        if ($drugId) {
            $keys[] = self::CACHE_PREFIX . "drug:{$drugId}";
        }
        
        if ($atcCode) {
            $keys[] = self::CACHE_PREFIX . "drugs:atc:{$atcCode}";
        }
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        
        Log::info('Drug formulary caches invalidated', [
            'drug_id' => $drugId,
            'atc_code' => $atcCode
        ]);
    }
    
    /**
     * Invalidate ward and bed-related caches
     */
    public function invalidateWardBedCaches($wardId = null): void
    {
        $keys = [
            self::WARDS_KEY,
            self::BEDS_KEY,
            self::CACHE_PREFIX . 'stats',
        ];
        
        if ($wardId) {
            $keys[] = self::WARD_BEDS_KEY . $wardId;
        }
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        
        Log::info('Ward/Bed caches invalidated', ['ward_id' => $wardId]);
    }
    
    /**
     * Clear all master data caches
     */
    public function clearAllCaches(): void
    {
        $pattern = self::CACHE_PREFIX . '*';
        
        // Get all cache keys matching the pattern
        $keys = Cache::getRedis()->keys($pattern);
        
        if (!empty($keys)) {
            foreach ($keys as $key) {
                Cache::forget($key);
            }
        }
        
        Log::info('All master data caches cleared');
    }
    
    /**
     * Warm up frequently accessed caches
     */
    public function warmUpCaches(): void
    {
        Log::info('Starting cache warm-up for master data');
        
        // Warm up departments
        $this->getDepartments(true);
        $this->getDepartments(false);
        
        // Warm up test catalogs
        $this->getTestCatalogs(true);
        $this->getTestCatalogs(false);
        
        // Warm up drug formulary
        $this->getDrugFormulary(true);
        $this->getDrugFormulary(false);
        
        // Warm up wards and beds
        $this->getWardsWithBeds();
        
        // Warm up stats
        $this->getMasterDataStats();
        
        Log::info('Cache warm-up completed for master data');
    }
}