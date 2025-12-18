<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\MasterDataCacheService;
use App\Models\Department;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Models\Ward;
use App\Models\Bed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Mockery;

class MasterDataCacheServiceTest extends TestCase
{
    protected MasterDataCacheService $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cacheService = new MasterDataCacheService();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_get_all_departments_with_caching()
    {
        $departments = collect([
            new Department(['id' => 1, 'name' => 'Cardiology']),
            new Department(['id' => 2, 'name' => 'Neurology'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:departments', 3600, \Closure::class)
            ->andReturn($departments);

        Department::shouldReceive('orderBy')
            ->with('sort_order')
            ->andReturnSelf();
        Department::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        Department::shouldReceive('get')
            ->andReturn($departments);

        $result = $this->cacheService->getDepartments();

        $this->assertEquals($departments, $result);
    }

    /** @test */
    public function it_can_get_active_departments_only()
    {
        $activeDepartments = collect([
            new Department(['id' => 1, 'name' => 'Cardiology', 'status' => 'active'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:departments:active', 3600, \Closure::class)
            ->andReturn($activeDepartments);

        Department::shouldReceive('orderBy')
            ->with('sort_order')
            ->andReturnSelf();
        Department::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        Department::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        Department::shouldReceive('get')
            ->andReturn($activeDepartments);

        $result = $this->cacheService->getDepartments(true);

        $this->assertEquals($activeDepartments, $result);
    }

    /** @test */
    public function it_can_get_specific_department_with_caching()
    {
        $department = new Department(['id' => 1, 'name' => 'Cardiology']);

        Cache::shouldReceive('remember')
            ->with('master_data:department:1', 3600, \Closure::class)
            ->andReturn($department);

        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $result = $this->cacheService->getDepartment(1);

        $this->assertEquals($department, $result);
    }

    /** @test */
    public function it_can_get_all_test_catalogs_with_caching()
    {
        $tests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC']),
            new TestCatalog(['id' => 2, 'name' => 'Blood Sugar'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:test_catalogs', 3600, \Closure::class)
            ->andReturn($tests);

        TestCatalog::shouldReceive('with')
            ->with(['department', 'category'])
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('category_id')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->andReturn($tests);

        $result = $this->cacheService->getTestCatalogs();

        $this->assertEquals($tests, $result);
    }

    /** @test */
    public function it_can_get_active_test_catalogs_only()
    {
        $activeTests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'status' => 'active'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:test_catalogs:active', 3600, \Closure::class)
            ->andReturn($activeTests);

        TestCatalog::shouldReceive('with')
            ->with(['department', 'category'])
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('category_id')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        TestCatalog::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->andReturn($activeTests);

        $result = $this->cacheService->getTestCatalogs(true);

        $this->assertEquals($activeTests, $result);
    }

    /** @test */
    public function it_can_get_test_catalogs_by_category()
    {
        $category = 'Hematology';
        $tests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'category_id' => 'Hematology'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:test_catalogs:category:Hematology', 3600, \Closure::class)
            ->andReturn($tests);

        TestCatalog::shouldReceive('with')
            ->with(['department', 'category'])
            ->andReturnSelf();
        TestCatalog::shouldReceive('where')
            ->with('category_id', 'Hematology')
            ->andReturnSelf();
        TestCatalog::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->andReturn($tests);

        $result = $this->cacheService->getTestCatalogsByCategory($category);

        $this->assertEquals($tests, $result);
    }

    /** @test */
    public function it_can_get_specific_test_catalog_with_caching()
    {
        $test = new TestCatalog(['id' => 1, 'name' => 'CBC']);

        Cache::shouldReceive('remember')
            ->with('master_data:test_catalog:1', 3600, \Closure::class)
            ->andReturn($test);

        TestCatalog::shouldReceive('with')
            ->with(['department'])
            ->andReturnSelf();
        TestCatalog::shouldReceive('find')
            ->with(1)
            ->andReturn($test);

        $result = $this->cacheService->getTestCatalog(1);

        $this->assertEquals($test, $result);
    }

    /** @test */
    public function it_can_get_all_drug_formulary_with_caching()
    {
        $drugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin']),
            new DrugFormulary(['id' => 2, 'name' => 'Paracetamol'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:drug_formulary', 3600, \Closure::class)
            ->andReturn($drugs);

        DrugFormulary::shouldReceive('with')
            ->with(['substitutes'])
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($drugs);

        $result = $this->cacheService->getDrugFormulary();

        $this->assertEquals($drugs, $result);
    }

    /** @test */
    public function it_can_get_active_drug_formulary_only()
    {
        $activeDrugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'status' => 'active'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:drug_formulary:active', 3600, \Closure::class)
            ->andReturn($activeDrugs);

        DrugFormulary::shouldReceive('with')
            ->with(['substitutes'])
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($activeDrugs);

        $result = $this->cacheService->getDrugFormulary(true);

        $this->assertEquals($activeDrugs, $result);
    }

    /** @test */
    public function it_can_get_specific_drug_with_caching()
    {
        $drug = new DrugFormulary(['id' => 1, 'name' => 'Aspirin']);

        Cache::shouldReceive('remember')
            ->with('master_data:drug:1', 3600, \Closure::class)
            ->andReturn($drug);

        DrugFormulary::shouldReceive('with')
            ->with(['substitutes'])
            ->andReturnSelf();
        DrugFormulary::shouldReceive('find')
            ->with(1)
            ->andReturn($drug);

        $result = $this->cacheService->getDrug(1);

        $this->assertEquals($drug, $result);
    }

    /** @test */
    public function it_can_get_drugs_by_atc_code()
    {
        $atcCode = 'N02BA';
        $drugs = collect([
            new DrugFormulary(['id' => 1, 'name' => 'Aspirin', 'atc_code' => 'N02BA01'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:drugs:atc:N02BA', 3600, \Closure::class)
            ->andReturn($drugs);

        DrugFormulary::shouldReceive('where')
            ->with('atc_code', 'like', 'N02BA%')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('get')
            ->andReturn($drugs);

        $result = $this->cacheService->getDrugsByAtcCode($atcCode);

        $this->assertEquals($drugs, $result);
    }

    /** @test */
    public function it_can_get_wards_with_beds()
    {
        $wards = collect([
            new Ward(['id' => 1, 'name' => 'ICU']),
            new Ward(['id' => 2, 'name' => 'General Ward'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:wards', 3600, \Closure::class)
            ->andReturn($wards);

        Ward::shouldReceive('with')
            ->with(['beds', 'department'])
            ->andReturnSelf();
        Ward::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        Ward::shouldReceive('get')
            ->andReturn($wards);

        $result = $this->cacheService->getWardsWithBeds();

        $this->assertEquals($wards, $result);
    }

    /** @test */
    public function it_can_get_ward_beds()
    {
        $wardId = 1;
        $beds = collect([
            new Bed(['id' => 1, 'bed_number' => 'B001', 'ward_id' => 1]),
            new Bed(['id' => 2, 'bed_number' => 'B002', 'ward_id' => 1])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data:ward_beds:1', 3600, \Closure::class)
            ->andReturn($beds);

        Bed::shouldReceive('where')
            ->with('ward_id', 1)
            ->andReturnSelf();
        Bed::shouldReceive('orderBy')
            ->with('bed_number')
            ->andReturnSelf();
        Bed::shouldReceive('get')
            ->andReturn($beds);

        $result = $this->cacheService->getWardBeds($wardId);

        $this->assertEquals($beds, $result);
    }

    /** @test */
    public function it_can_get_master_data_statistics()
    {
        $stats = [
            'departments' => 5,
            'wards' => 15,
            'beds' => 100,
            'tests' => 50,
            'drugs' => 200,
            'occupied_beds' => 60,
            'available_beds' => 40
        ];

        Cache::shouldReceive('remember')
            ->with('master_data:stats', 300, \Closure::class)
            ->andReturn($stats);

        Department::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        Department::shouldReceive('count')
            ->andReturn(5);

        Ward::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        Ward::shouldReceive('count')
            ->andReturn(15);

        Bed::shouldReceive('whereIn')
            ->with('status', ['available', 'occupied'])
            ->andReturnSelf();
        Bed::shouldReceive('count')
            ->andReturn(100);

        TestCatalog::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        TestCatalog::shouldReceive('count')
            ->andReturn(50);

        DrugFormulary::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        DrugFormulary::shouldReceive('count')
            ->andReturn(200);

        Bed::shouldReceive('where')
            ->with('status', 'occupied')
            ->andReturnSelf();
        Bed::shouldReceive('count')
            ->andReturn(60);

        Bed::shouldReceive('where')
            ->with('status', 'available')
            ->andReturnSelf();
        Bed::shouldReceive('count')
            ->andReturn(40);

        $result = $this->cacheService->getMasterDataStats();

        $this->assertEquals($stats, $result);
    }

    /** @test */
    public function it_can_invalidate_department_caches()
    {
        $departmentId = 1;

        Cache::shouldReceive('forget')
            ->with([
                'master_data:departments',
                'master_data:departments:active',
                'master_data:stats',
                'master_data:department:1'
            ])
            ->once();

        Log::shouldReceive('info')
            ->with('Department caches invalidated', ['department_id' => 1])
            ->once();

        $this->cacheService->invalidateDepartmentCaches($departmentId);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_department_caches_without_specific_id()
    {
        Cache::shouldReceive('forget')
            ->with([
                'master_data:departments',
                'master_data:departments:active',
                'master_data:stats'
            ])
            ->once();

        Log::shouldReceive('info')
            ->with('Department caches invalidated', ['department_id' => null])
            ->once();

        $this->cacheService->invalidateDepartmentCaches();

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_test_catalog_caches()
    {
        $testId = 1;
        $category = 'Hematology';

        Cache::shouldReceive('forget')
            ->with([
                'master_data:test_catalogs',
                'master_data:test_catalogs:active',
                'master_data:stats',
                'master_data:test_catalog:1',
                'master_data:test_catalogs:category:Hematology'
            ])
            ->once();

        Log::shouldReceive('info')
            ->with('Test catalog caches invalidated', [
                'test_id' => 1,
                'category' => 'Hematology'
            ])
            ->once();

        $this->cacheService->invalidateTestCatalogCaches($testId, $category);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_drug_formulary_caches()
    {
        $drugId = 1;
        $atcCode = 'N02BA01';

        Cache::shouldReceive('forget')
            ->with([
                'master_data:drug_formulary',
                'master_data:drug_formulary:active',
                'master_data:stats',
                'master_data:drug:1',
                'master_data:drugs:atc:N02BA01'
            ])
            ->once();

        Log::shouldReceive('info')
            ->with('Drug formulary caches invalidated', [
                'drug_id' => 1,
                'atc_code' => 'N02BA01'
            ])
            ->once();

        $this->cacheService->invalidateDrugFormularyCaches($drugId, $atcCode);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_ward_bed_caches()
    {
        $wardId = 1;

        Cache::shouldReceive('forget')
            ->with([
                'master_data:wards',
                'master_data:beds',
                'master_data:stats',
                'master_data:ward_beds:1'
            ])
            ->once();

        Log::shouldReceive('info')
            ->with('Ward/Bed caches invalidated', ['ward_id' => 1])
            ->once();

        $this->cacheService->invalidateWardBedCaches($wardId);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_clear_all_caches()
    {
        Cache::shouldReceive('getRedis')
            ->andReturnSelf();
        Cache::shouldReceive('keys')
            ->with('master_data:*')
            ->andReturn(['master_data:departments', 'master_data:wards']);

        Cache::shouldReceive('forget')
            ->with(['master_data:departments', 'master_data:wards'])
            ->once();

        Log::shouldReceive('info')
            ->with('All master data caches cleared')
            ->once();

        $this->cacheService->clearAllCaches();

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_warm_up_caches()
    {
        Log::shouldReceive('info')
            ->with('Starting cache warm-up for master data')
            ->once();

        // Mock all the cache warming calls
        Cache::shouldReceive('remember')->times(7)->andReturn(collect([]));

        // Mock model queries for cache warming
        Department::shouldReceive('orderBy')->andReturnSelf();
        Department::shouldReceive('where')->andReturnSelf();
        Department::shouldReceive('get')->andReturn(collect([]));

        TestCatalog::shouldReceive('with')->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')->andReturnSelf();
        TestCatalog::shouldReceive('where')->andReturnSelf();
        TestCatalog::shouldReceive('get')->andReturn(collect([]));

        DrugFormulary::shouldReceive('with')->andReturnSelf();
        DrugFormulary::shouldReceive('orderBy')->andReturnSelf();
        DrugFormulary::shouldReceive('where')->andReturnSelf();
        DrugFormulary::shouldReceive('get')->andReturn(collect([]));

        Ward::shouldReceive('with')->andReturnSelf();
        Ward::shouldReceive('orderBy')->andReturnSelf();
        Ward::shouldReceive('get')->andReturn(collect([]));

        // Mock stats queries
        Department::shouldReceive('count')->andReturn(0);
        Ward::shouldReceive('count')->andReturn(0);
        Bed::shouldReceive('whereIn')->andReturnSelf();
        Bed::shouldReceive('count')->andReturn(0);
        Bed::shouldReceive('where')->andReturnSelf();
        TestCatalog::shouldReceive('count')->andReturn(0);
        DrugFormulary::shouldReceive('count')->andReturn(0);

        Log::shouldReceive('info')
            ->with('Cache warm-up completed for master data')
            ->once();

        $this->cacheService->warmUpCaches();

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }
}