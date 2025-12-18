<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\TestCatalogService;
use App\Services\MasterDataService;
use App\Services\MasterDataCacheService;
use App\Models\TestCatalog;
use App\Models\Department;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Mockery;

class TestCatalogServiceTest extends TestCase
{
    protected TestCatalogService $testCatalogService;
    protected $masterDataService;
    protected $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->masterDataService = Mockery::mock(MasterDataService::class);
        $this->cacheService = Mockery::mock(MasterDataCacheService::class);
        
        $this->testCatalogService = new TestCatalogService(
            $this->masterDataService,
            $this->cacheService
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_get_all_tests_without_filters()
    {
        $tests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'code' => 'CBC001']),
            new TestCatalog(['id' => 2, 'name' => 'Blood Sugar', 'code' => 'BS001'])
        ]);

        $this->cacheService
            ->shouldReceive('getTestCatalogs')
            ->with(false)
            ->once()
            ->andReturn($tests);

        $result = $this->testCatalogService->getAllTests();

        $this->assertEquals($tests, $result);
    }

    /** @test */
    public function it_can_get_active_tests_only()
    {
        $activeTests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'code' => 'CBC001', 'status' => 'active'])
        ]);

        $this->cacheService
            ->shouldReceive('getTestCatalogs')
            ->with(true)
            ->once()
            ->andReturn($activeTests);

        $result = $this->testCatalogService->getAllTests(['status' => 'active']);

        $this->assertEquals($activeTests, $result);
    }

    /** @test */
    public function it_can_get_tests_by_category()
    {
        $category = 'Hematology';
        $tests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'category' => 'Hematology'])
        ]);

        $this->cacheService
            ->shouldReceive('getTestCatalogsByCategory')
            ->with($category)
            ->once()
            ->andReturn($tests);

        $result = $this->testCatalogService->getAllTests(['category' => $category]);

        $this->assertEquals($tests, $result);
    }

    /** @test */
    public function it_can_get_active_tests()
    {
        $activeTests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'status' => 'active'])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.tests.active', 3600, \Closure::class)
            ->andReturn($activeTests);

        TestCatalog::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('category')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->with(['id', 'name', 'code', 'category', 'price', 'unit'])
            ->andReturn($activeTests);

        $result = $this->testCatalogService->getActiveTests();

        $this->assertEquals($activeTests, $result);
    }

    /** @test */
    public function it_can_get_tests_grouped_by_category()
    {
        $testsByCategory = [
            'Hematology' => [
                ['id' => 1, 'name' => 'CBC', 'category' => 'Hematology']
            ],
            'Biochemistry' => [
                ['id' => 2, 'name' => 'Blood Sugar', 'category' => 'Biochemistry']
            ]
        ];

        Cache::shouldReceive('remember')
            ->with('master_data.tests.by_category', 1800, \Closure::class)
            ->andReturn($testsByCategory);

        TestCatalog::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('category')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->andReturn(collect([
                new TestCatalog(['id' => 1, 'name' => 'CBC', 'category' => 'Hematology']),
                new TestCatalog(['id' => 2, 'name' => 'Blood Sugar', 'category' => 'Biochemistry'])
            ]));

        $result = $this->testCatalogService->getTestsByCategory();

        $this->assertEquals($testsByCategory, $result);
    }

    /** @test */
    public function it_can_get_test_categories()
    {
        $categories = ['Hematology', 'Biochemistry', 'Microbiology'];

        Cache::shouldReceive('remember')
            ->with('master_data.tests.categories', 3600, \Closure::class)
            ->andReturn($categories);

        TestCatalog::shouldReceive('distinct')
            ->andReturnSelf();
        TestCatalog::shouldReceive('pluck')
            ->with('category')
            ->andReturn(collect(['Hematology', 'Biochemistry', 'Microbiology', null]));

        $result = $this->testCatalogService->getTestCategories();

        $this->assertEquals($categories, $result);
    }

    /** @test */
    public function it_can_create_test_with_valid_data()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'department_id' => 1,
            'category' => 'Hematology',
            'price' => 25.00,
            'turnaround_time' => 24,
            'unit' => 'per test'
        ];

        // Mock department validation
        $department = new Department(['id' => 1, 'name' => 'Laboratory', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock test code uniqueness check
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(false);

        // Mock test creation
        $test = new TestCatalog(array_merge($data, ['status' => 'active']));
        $test->id = 1;
        
        TestCatalog::shouldReceive('create')
            ->with(array_merge($data, ['status' => 'active']))
            ->andReturn($test);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('test_catalog', 1, 'created', [], $test->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('test_catalog', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->testCatalogService->createTest($data);

        $this->assertEquals($test, $result);
        $this->assertEquals('active', $result->status);
    }

    /** @test */
    public function it_throws_validation_exception_for_duplicate_test_code()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001', // Duplicate code
            'department_id' => 1,
            'price' => 25.00,
            'turnaround_time' => 24
        ];

        // Mock that code exists
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(true);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Test code must be unique');

        $this->testCatalogService->createTest($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_department()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'department_id' => 999, // Non-existent department
            'price' => 25.00,
            'turnaround_time' => 24
        ];

        // Mock test code uniqueness check
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(false);

        Department::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Department not found');

        $this->testCatalogService->createTest($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_inactive_department()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'department_id' => 1,
            'price' => 25.00,
            'turnaround_time' => 24
        ];

        // Mock test code uniqueness check
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(false);

        $department = new Department(['id' => 1, 'name' => 'Laboratory', 'status' => 'inactive']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Cannot assign test to inactive department');

        $this->testCatalogService->createTest($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_price()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'department_id' => 1,
            'price' => 0, // Invalid price
            'turnaround_time' => 24
        ];

        // Mock test code uniqueness check
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(false);

        $department = new Department(['id' => 1, 'name' => 'Laboratory', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Test price must be greater than 0');

        $this->testCatalogService->createTest($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_turnaround_time()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'department_id' => 1,
            'price' => 25.00,
            'turnaround_time' => 0 // Invalid TAT
        ];

        // Mock test code uniqueness check
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(false);

        $department = new Department(['id' => 1, 'name' => 'Laboratory', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Turnaround time must be greater than 0 hours');

        $this->testCatalogService->createTest($data);
    }

    /** @test */
    public function it_can_update_test_with_valid_data()
    {
        $test = new TestCatalog([
            'id' => 1,
            'name' => 'CBC',
            'code' => 'CBC001',
            'department_id' => 1,
            'price' => 25.00
        ]);

        $updateData = ['price' => 30.00];
        $oldValues = $test->toArray();

        $test->shouldReceive('update')
            ->with($updateData)
            ->once();

        $updatedTest = new TestCatalog(array_merge($test->toArray(), $updateData));
        $test->shouldReceive('fresh')
            ->andReturn($updatedTest);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('test_catalog', 1, 'updated', $oldValues, $updatedTest->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('test_catalog', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->testCatalogService->updateTest($test, $updateData);

        $this->assertEquals($updatedTest, $result);
    }

    /** @test */
    public function it_can_update_test_price_with_validation()
    {
        $test = new TestCatalog([
            'id' => 1,
            'name' => 'CBC',
            'price' => 25.00
        ]);

        $newPrice = 30.00;

        $test->shouldReceive('update')
            ->with(['price' => $newPrice])
            ->once();

        $updatedTest = new TestCatalog(array_merge($test->toArray(), ['price' => $newPrice]));
        $test->shouldReceive('fresh')
            ->andReturn($updatedTest);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->testCatalogService->updateTestPrice($test, $newPrice);

        $this->assertEquals($updatedTest, $result);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_price_update()
    {
        $test = new TestCatalog([
            'id' => 1,
            'name' => 'CBC',
            'price' => 25.00
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Test price must be greater than 0');

        $this->testCatalogService->updateTestPrice($test, 0);
    }

    /** @test */
    public function it_can_update_turnaround_time_with_validation()
    {
        $test = new TestCatalog([
            'id' => 1,
            'name' => 'CBC',
            'turnaround_time' => 24
        ]);

        $newTAT = 48;

        $test->shouldReceive('update')
            ->with(['turnaround_time' => $newTAT])
            ->once();

        $updatedTest = new TestCatalog(array_merge($test->toArray(), ['turnaround_time' => $newTAT]));
        $test->shouldReceive('fresh')
            ->andReturn($updatedTest);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->testCatalogService->updateTurnaroundTime($test, $newTAT);

        $this->assertEquals($updatedTest, $result);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_turnaround_time_update()
    {
        $test = new TestCatalog([
            'id' => 1,
            'name' => 'CBC',
            'turnaround_time' => 24
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Turnaround time must be greater than 0 hours');

        $this->testCatalogService->updateTurnaroundTime($test, 0);
    }

    /** @test */
    public function it_can_get_test_statistics()
    {
        $stats = [
            'total_tests' => 100,
            'active_tests' => 85,
            'inactive_tests' => 15,
            'categories_count' => 5,
            'avg_price' => 45.50,
            'avg_turnaround_time' => 36.5,
            'price_range' => ['min' => 10.00, 'max' => 200.00],
            'by_category' => [
                'Hematology' => 25,
                'Biochemistry' => 30,
                'Microbiology' => 20
            ]
        ];

        Cache::shouldReceive('remember')
            ->with('master_data.tests.stats', 1800, \Closure::class)
            ->andReturn($stats);

        TestCatalog::shouldReceive('query')
            ->andReturnSelf();
        TestCatalog::shouldReceive('count')
            ->andReturn(100);
        TestCatalog::shouldReceive('where')
            ->andReturnSelf();
        TestCatalog::shouldReceive('distinct')
            ->andReturnSelf();
        TestCatalog::shouldReceive('avg')
            ->andReturn(45.50);
        TestCatalog::shouldReceive('min')
            ->andReturn(10.00);
        TestCatalog::shouldReceive('max')
            ->andReturn(200.00);
        TestCatalog::shouldReceive('groupBy')
            ->andReturnSelf();
        TestCatalog::shouldReceive('selectRaw')
            ->andReturnSelf();
        TestCatalog::shouldReceive('pluck')
            ->andReturn(collect(['Hematology' => 25, 'Biochemistry' => 30, 'Microbiology' => 20]));

        $result = $this->testCatalogService->getTestStats();

        $this->assertEquals($stats, $result);
    }

    /** @test */
    public function it_can_bulk_update_test_prices()
    {
        $priceUpdates = [
            ['test_id' => 1, 'price' => 30.00],
            ['test_id' => 2, 'price' => 45.00]
        ];

        $test1 = new TestCatalog(['id' => 1, 'name' => 'CBC', 'price' => 25.00]);
        $test2 = new TestCatalog(['id' => 2, 'name' => 'Blood Sugar', 'price' => 40.00]);

        TestCatalog::shouldReceive('find')
            ->with(1)
            ->andReturn($test1);
        TestCatalog::shouldReceive('find')
            ->with(2)
            ->andReturn($test2);

        // Mock updates
        $test1->shouldReceive('toArray')
            ->andReturn($test1->toArray());
        $test1->shouldReceive('update')
            ->with(['price' => 30.00]);
        $test1->shouldReceive('fresh')
            ->andReturn($test1);

        $test2->shouldReceive('toArray')
            ->andReturn($test2->toArray());
        $test2->shouldReceive('update')
            ->with(['price' => 45.00]);
        $test2->shouldReceive('fresh')
            ->andReturn($test2);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->twice();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('test_catalog', 0)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->testCatalogService->bulkUpdatePrices($priceUpdates);

        $this->assertCount(2, $results);
        $this->assertTrue($results[0]['success']);
        $this->assertTrue($results[1]['success']);
    }

    /** @test */
    public function it_handles_test_not_found_in_bulk_price_update()
    {
        $priceUpdates = [
            ['test_id' => 999, 'price' => 30.00] // Non-existent test
        ];

        TestCatalog::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->testCatalogService->bulkUpdatePrices($priceUpdates);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Test not found', $results[0]['error']);
    }

    /** @test */
    public function it_handles_invalid_price_in_bulk_update()
    {
        $priceUpdates = [
            ['test_id' => 1, 'price' => 0] // Invalid price
        ];

        $test = new TestCatalog(['id' => 1, 'name' => 'CBC']);

        TestCatalog::shouldReceive('find')
            ->with(1)
            ->andReturn($test);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->testCatalogService->bulkUpdatePrices($priceUpdates);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Price must be greater than 0', $results[0]['error']);
    }

    /** @test */
    public function it_can_toggle_test_status()
    {
        $test = new TestCatalog([
            'id' => 1,
            'name' => 'CBC',
            'status' => 'active'
        ]);

        $oldValues = $test->toArray();

        $test->shouldReceive('update')
            ->with(['status' => 'inactive'])
            ->once();

        $updatedTest = new TestCatalog(array_merge($test->toArray(), ['status' => 'inactive']));
        $test->shouldReceive('fresh')
            ->andReturn($updatedTest);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('test_catalog', 1, 'updated', $oldValues, $updatedTest->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('test_catalog', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->testCatalogService->toggleTestStatus($test);

        $this->assertEquals('inactive', $result->status);
    }

    /** @test */
    public function it_can_get_tests_by_sample_type()
    {
        $sampleType = 'Blood';
        $tests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'sample_type' => 'Blood'])
        ]);

        TestCatalog::shouldReceive('where')
            ->with('sample_type', 'Blood')
            ->andReturnSelf();
        TestCatalog::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        TestCatalog::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->andReturn($tests);

        $result = $this->testCatalogService->getTestsBySampleType($sampleType);

        $this->assertEquals($tests, $result);
    }

    /** @test */
    public function it_returns_zero_pending_orders()
    {
        $test = new TestCatalog(['id' => 1, 'name' => 'CBC']);

        $pendingCount = $this->testCatalogService->hasPendingOrders($test);

        $this->assertEquals(0, $pendingCount);
    }

    /** @test */
    public function it_rollsback_transaction_on_exception_during_creation()
    {
        $data = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'department_id' => 1,
            'price' => 25.00,
            'turnaround_time' => 24
        ];

        // Mock test code uniqueness check
        TestCatalog::shouldReceive('where')
            ->with('code', 'CBC001')
            ->andReturnSelf();
        TestCatalog::shouldReceive('exists')
            ->andReturn(false);

        $department = new Department(['id' => 1, 'name' => 'Laboratory', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock exception during creation
        TestCatalog::shouldReceive('create')
            ->andThrow(new \Exception('Database error'));

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database error');

        $this->testCatalogService->createTest($data);
    }
 }

