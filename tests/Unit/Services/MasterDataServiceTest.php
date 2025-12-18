<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\MasterDataService;
use App\Services\MasterDataCacheService;
use App\Models\MasterDataAudit;
use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Mockery;

class MasterDataServiceTest extends TestCase
{
    protected MasterDataService $masterDataService;
    protected $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->cacheService = Mockery::mock(MasterDataCacheService::class);
        $this->masterDataService = new MasterDataService($this->cacheService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_validate_entity_references_with_no_violations()
    {
        $department = new Department(['id' => 1, 'name' => 'Cardiology']);
        
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock no related wards
        $department->shouldReceive('wards')
            ->andReturnSelf();
        $department->shouldReceive('count')
            ->andReturn(0);

        // Mock no related test catalogs
        $department->shouldReceive('test_catalogs')
            ->andReturnSelf();
        $department->shouldReceive('count')
            ->andReturn(0);

        $violations = $this->masterDataService->validateEntityReferences('department', 1);

        $this->assertEmpty($violations);
    }

    /** @test */
    public function it_can_validate_entity_references_with_violations()
    {
        $department = new Department(['id' => 1, 'name' => 'Cardiology']);
        
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock related wards exist
        $department->shouldReceive('wards')
            ->andReturnSelf();
        $department->shouldReceive('count')
            ->andReturn(3);

        // Mock related test catalogs exist
        $department->shouldReceive('test_catalogs')
            ->andReturnSelf();
        $department->shouldReceive('count')
            ->andReturn(5);

        $violations = $this->masterDataService->validateEntityReferences('department', 1);

        $this->assertCount(2, $violations);
        $this->assertEquals('wards', $violations[0]['relationship']);
        $this->assertEquals(3, $violations[0]['count']);
        $this->assertStringContains('Cannot delete department because it has 3 related wards', $violations[0]['message']);
        
        $this->assertEquals('test_catalogs', $violations[1]['relationship']);
        $this->assertEquals(5, $violations[1]['count']);
        $this->assertStringContains('Cannot delete department because it has 5 related test_catalogs', $violations[1]['message']);
    }

    /** @test */
    public function it_returns_empty_violations_for_unknown_entity_type()
    {
        $violations = $this->masterDataService->validateEntityReferences('unknown_entity', 1);

        $this->assertEmpty($violations);
    }

    /** @test */
    public function it_returns_empty_violations_for_non_existent_entity()
    {
        Department::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        $violations = $this->masterDataService->validateEntityReferences('department', 999);

        $this->assertEmpty($violations);
    }

    /** @test */
    public function it_can_log_master_data_changes()
    {
        $user = new User(['id' => 1, 'name' => 'Test User']);
        Auth::shouldReceive('id')->andReturn(1);

        $entityType = 'department';
        $entityId = 1;
        $newValues = ['name' => 'Updated Department'];
        $action = 'updated';
        $oldValues = ['name' => 'Original Department'];

        MasterDataAudit::shouldReceive('create')
            ->with([
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => $action,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'user_id' => 1,
            ])
            ->once();

        $this->masterDataService->logMasterDataChange(
            $entityType,
            $entityId,
            $newValues,
            $action,
            $oldValues
        );

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_department_caches()
    {
        $this->cacheService
            ->shouldReceive('invalidateDepartmentCaches')
            ->with(1)
            ->once();

        $this->masterDataService->invalidateRelatedCaches('department', 1);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_ward_bed_caches()
    {
        $this->cacheService
            ->shouldReceive('invalidateWardBedCaches')
            ->with(1)
            ->once();

        $this->masterDataService->invalidateRelatedCaches('ward', 1);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_bed_caches()
    {
        $this->cacheService
            ->shouldReceive('invalidateWardBedCaches')
            ->with(null)
            ->once();

        $this->masterDataService->invalidateRelatedCaches('bed', 1);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_test_catalog_caches()
    {
        $this->cacheService
            ->shouldReceive('invalidateTestCatalogCaches')
            ->with(1)
            ->once();

        $this->masterDataService->invalidateRelatedCaches('test_catalog', 1);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_invalidate_drug_formulary_caches()
    {
        $this->cacheService
            ->shouldReceive('invalidateDrugFormularyCaches')
            ->with(1)
            ->once();

        $this->masterDataService->invalidateRelatedCaches('drug_formulary', 1);

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /** @test */
    public function it_can_export_department_data()
    {
        $departments = collect([
            new Department(['id' => 1, 'name' => 'Cardiology', 'status' => 'active']),
            new Department(['id' => 2, 'name' => 'Neurology', 'status' => 'active'])
        ]);

        Department::shouldReceive('query')
            ->andReturnSelf();
        Department::shouldReceive('get')
            ->andReturn($departments);

        $result = $this->masterDataService->exportEntityData('department');

        $this->assertEquals($departments, $result);
    }

    /** @test */
    public function it_can_export_data_with_status_filter()
    {
        $filters = ['status' => 'active'];
        $departments = collect([
            new Department(['id' => 1, 'name' => 'Cardiology', 'status' => 'active'])
        ]);

        Department::shouldReceive('query')
            ->andReturnSelf();
        Department::shouldReceive('where')
            ->with('status', 'active')
            ->andReturnSelf();
        Department::shouldReceive('get')
            ->andReturn($departments);

        $result = $this->masterDataService->exportEntityData('department', $filters);

        $this->assertEquals($departments, $result);
    }

    /** @test */
    public function it_can_export_data_with_date_filters()
    {
        $filters = [
            'created_after' => '2024-01-01',
            'created_before' => '2024-12-31'
        ];
        $departments = collect([
            new Department(['id' => 1, 'name' => 'Cardiology'])
        ]);

        Department::shouldReceive('query')
            ->andReturnSelf();
        Department::shouldReceive('where')
            ->with('created_at', '>=', '2024-01-01')
            ->andReturnSelf();
        Department::shouldReceive('where')
            ->with('created_at', '<=', '2024-12-31')
            ->andReturnSelf();
        Department::shouldReceive('get')
            ->andReturn($departments);

        $result = $this->masterDataService->exportEntityData('department', $filters);

        $this->assertEquals($departments, $result);
    }

    /** @test */
    public function it_can_export_ward_data_with_relationships()
    {
        $wards = collect([
            new Ward(['id' => 1, 'name' => 'ICU', 'department_id' => 1])
        ]);

        Ward::shouldReceive('query')
            ->andReturnSelf();
        Ward::shouldReceive('with')
            ->with('department')
            ->andReturnSelf();
        Ward::shouldReceive('get')
            ->andReturn($wards);

        $result = $this->masterDataService->exportEntityData('ward');

        $this->assertEquals($wards, $result);
    }

    /** @test */
    public function it_can_export_bed_data_with_relationships()
    {
        $beds = collect([
            new Bed(['id' => 1, 'bed_number' => 'B001', 'ward_id' => 1])
        ]);

        Bed::shouldReceive('query')
            ->andReturnSelf();
        Bed::shouldReceive('with')
            ->with(['ward', 'ward.department'])
            ->andReturnSelf();
        Bed::shouldReceive('get')
            ->andReturn($beds);

        $result = $this->masterDataService->exportEntityData('bed');

        $this->assertEquals($beds, $result);
    }

    /** @test */
    public function it_can_export_test_catalog_data_with_filters()
    {
        $filters = ['department_id' => 1, 'category' => 'Hematology'];
        $tests = collect([
            new TestCatalog(['id' => 1, 'name' => 'CBC', 'department_id' => 1, 'category' => 'Hematology'])
        ]);

        TestCatalog::shouldReceive('query')
            ->andReturnSelf();
        TestCatalog::shouldReceive('with')
            ->with('department')
            ->andReturnSelf();
        TestCatalog::shouldReceive('where')
            ->with('department_id', 1)
            ->andReturnSelf();
        TestCatalog::shouldReceive('where')
            ->with('category', 'Hematology')
            ->andReturnSelf();
        TestCatalog::shouldReceive('get')
            ->andReturn($tests);

        $result = $this->masterDataService->exportEntityData('test_catalog', $filters);

        $this->assertEquals($tests, $result);
    }

    /** @test */
    public function it_throws_exception_for_unknown_entity_type_in_export()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown entity type: unknown_entity');

        $this->masterDataService->exportEntityData('unknown_entity');
    }

    /** @test */
    public function it_can_get_master_data_stats()
    {
        $stats = [
            'departments' => 5,
            'wards' => 15,
            'beds' => 100,
            'tests' => 50,
            'drugs' => 200
        ];

        $this->cacheService
            ->shouldReceive('getMasterDataStats')
            ->andReturn($stats);

        $result = $this->masterDataService->getMasterDataStats();

        $this->assertEquals($stats, $result);
    }

    /** @test */
    public function it_can_get_recent_activity()
    {
        $user = new User(['id' => 1, 'name' => 'Test User']);
        $audits = collect([
            new MasterDataAudit([
                'id' => 1,
                'entity_type' => 'department',
                'entity_id' => 1,
                'action' => 'created',
                'old_values' => [],
                'new_values' => ['name' => 'Cardiology'],
                'user_id' => 1,
                'created_at' => now()
            ])
        ]);

        $audits->first()->setRelation('user', $user);

        MasterDataAudit::shouldReceive('with')
            ->with('user')
            ->andReturnSelf();
        MasterDataAudit::shouldReceive('orderBy')
            ->with('created_at', 'desc')
            ->andReturnSelf();
        MasterDataAudit::shouldReceive('limit')
            ->with(20)
            ->andReturnSelf();
        MasterDataAudit::shouldReceive('get')
            ->andReturn($audits);

        $result = $this->masterDataService->getRecentActivity();

        $this->assertCount(1, $result);
        $this->assertEquals('department', $result->first()['entity_type']);
        $this->assertEquals('Test User', $result->first()['user_name']);
        $this->assertEquals('Created new department', $result->first()['summary']);
    }

    /** @test */
    public function it_can_get_recent_activity_with_custom_limit()
    {
        $audits = collect([]);

        MasterDataAudit::shouldReceive('with')
            ->with('user')
            ->andReturnSelf();
        MasterDataAudit::shouldReceive('orderBy')
            ->with('created_at', 'desc')
            ->andReturnSelf();
        MasterDataAudit::shouldReceive('limit')
            ->with(10)
            ->andReturnSelf();
        MasterDataAudit::shouldReceive('get')
            ->andReturn($audits);

        $result = $this->masterDataService->getRecentActivity(10);

        $this->assertCount(0, $result);
    }

    /** @test */
    public function it_generates_activity_summary_for_created_action()
    {
        $audit = new MasterDataAudit([
            'entity_type' => 'department',
            'action' => 'created'
        ]);

        $summary = $this->invokeMethod($this->masterDataService, 'generateActivitySummary', [$audit]);

        $this->assertEquals('Created new department', $summary);
    }

    /** @test */
    public function it_generates_activity_summary_for_updated_action()
    {
        $audit = new MasterDataAudit([
            'entity_type' => 'department',
            'action' => 'updated',
            'new_values' => ['name' => 'New Name', 'status' => 'active']
        ]);

        $summary = $this->invokeMethod($this->masterDataService, 'generateActivitySummary', [$audit]);

        $this->assertEquals('Updated department (name, status)', $summary);
    }

    /** @test */
    public function it_generates_activity_summary_for_status_changed_action()
    {
        $audit = new MasterDataAudit([
            'entity_type' => 'department',
            'action' => 'status_changed',
            'old_values' => ['status' => 'active'],
            'new_values' => ['status' => 'inactive']
        ]);

        $summary = $this->invokeMethod($this->masterDataService, 'generateActivitySummary', [$audit]);

        $this->assertEquals('Changed department status from active to inactive', $summary);
    }

    /** @test */
    public function it_can_bulk_update_entities()
    {
        $updates = [
            ['id' => 1, 'data' => ['name' => 'Updated Department 1']],
            ['id' => 2, 'data' => ['name' => 'Updated Department 2']]
        ];

        $department1 = new Department(['id' => 1, 'name' => 'Department 1']);
        $department2 = new Department(['id' => 2, 'name' => 'Department 2']);

        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department1);
        Department::shouldReceive('find')
            ->with(2)
            ->andReturn($department2);

        // Mock updates
        $department1->shouldReceive('toArray')
            ->andReturn($department1->toArray());
        $department1->shouldReceive('update')
            ->with(['name' => 'Updated Department 1']);
        $department1->shouldReceive('fresh')
            ->andReturn($department1);

        $department2->shouldReceive('toArray')
            ->andReturn($department2->toArray());
        $department2->shouldReceive('update')
            ->with(['name' => 'Updated Department 2']);
        $department2->shouldReceive('fresh')
            ->andReturn($department2);

        // Mock audit logging
        Auth::shouldReceive('id')->andReturn(1);
        MasterDataAudit::shouldReceive('create')->twice();

        // Mock cache invalidation
        $this->cacheService
            ->shouldReceive('invalidateDepartmentCaches')
            ->with(0)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->masterDataService->bulkUpdateEntities('department', $updates);

        $this->assertCount(2, $results);
        $this->assertTrue($results[0]['success']);
        $this->assertTrue($results[1]['success']);
    }

    /** @test */
    public function it_handles_entity_not_found_in_bulk_update()
    {
        $updates = [
            ['id' => 999, 'data' => ['name' => 'Updated Department']]
        ];

        Department::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->masterDataService->bulkUpdateEntities('department', $updates);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Entity not found', $results[0]['error']);
    }

    /** @test */
    public function it_rollsback_transaction_on_exception_in_bulk_update()
    {
        $updates = [
            ['id' => 1, 'data' => ['name' => 'Updated Department']]
        ];

        $department = new Department(['id' => 1, 'name' => 'Department']);

        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $department->shouldReceive('toArray')
            ->andReturn($department->toArray());
        $department->shouldReceive('update')
            ->andThrow(new \Exception('Database error'));

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database error');

        $this->masterDataService->bulkUpdateEntities('department', $updates);
    }

    /** @test */
    public function it_can_invalidate_entity_type_cache()
    {
        Cache::shouldReceive('forget')
            ->with([
                'master_data.department.all',
                'master_data.department.active',
                'master_data.stats'
            ])
            ->once();

        $this->masterDataService->invalidateEntityTypeCache('department');

        // Assertion is implicit in the mock expectation
        $this->assertTrue(true);
    }

    /**
     * Helper method to invoke protected/private methods
     */
    protected function invokeMethod($object, $methodName, array $parameters = [])
    {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);

        return $method->invokeArgs($object, $parameters);
    }
}