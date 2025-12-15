<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\DepartmentService;
use App\Services\MasterDataService;
use App\Services\MasterDataCacheService;
use App\Models\Department;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Mockery;

class DepartmentServiceTest extends TestCase
{
    protected DepartmentService $departmentService;
    protected $masterDataService;
    protected $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->masterDataService = Mockery::mock(MasterDataService::class);
        $this->cacheService = Mockery::mock(MasterDataCacheService::class);
        
        $this->departmentService = new DepartmentService(
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
    public function it_can_get_all_departments_without_filters()
    {
        $departments = new \Illuminate\Database\Eloquent\Collection([
            new Department(['id' => 1, 'name' => 'Cardiology', 'code' => 'CARD']),
            new Department(['id' => 2, 'name' => 'Neurology', 'code' => 'NEURO'])
        ]);

        $this->cacheService
            ->shouldReceive('getDepartments')
            ->with(false)
            ->once()
            ->andReturn($departments);

        $result = $this->departmentService->getAllDepartments();

        $this->assertEquals($departments, $result);
    }

    /** @test */
    public function it_can_get_active_departments_only()
    {
        $activeDepartments = new \Illuminate\Database\Eloquent\Collection([
            new Department(['id' => 1, 'name' => 'Cardiology', 'code' => 'CARD', 'status' => 'active'])
        ]);

        $this->cacheService
            ->shouldReceive('getDepartments')
            ->with(true)
            ->once()
            ->andReturn($activeDepartments);

        $result = $this->departmentService->getAllDepartments(['status' => 'active']);

        $this->assertEquals($activeDepartments, $result);
    }

    /** @test */
    public function it_can_create_department_with_valid_data()
    {
        $data = [
            'name' => 'Emergency Medicine',
            'code' => 'EM',
            'description' => 'Emergency department',
            'icon' => 'emergency'
        ];

        // Mock that code doesn't exist
        Department::shouldReceive('where')
            ->with('code', 'EM')
            ->andReturnSelf();
        Department::shouldReceive('exists')
            ->andReturn(false);

        // Mock max sort order
        Department::shouldReceive('max')
            ->with('sort_order')
            ->andReturn(5);

        // Mock department creation
        $department = new Department(array_merge($data, ['sort_order' => 6, 'status' => 'active']));
        $department->id = 1;
        
        Department::shouldReceive('create')
            ->with(array_merge($data, ['sort_order' => 6, 'status' => 'active']))
            ->andReturn($department);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('department', 1, 'created', [], $department->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('department', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->departmentService->createDepartment($data);

        $this->assertEquals($department, $result);
        $this->assertEquals('active', $result->status);
        $this->assertEquals(6, $result->sort_order);
    }

    /** @test */
    public function it_throws_validation_exception_for_duplicate_code()
    {
        $data = [
            'name' => 'Emergency Medicine',
            'code' => 'CARD', // Duplicate code
        ];

        // Mock that code exists
        Department::shouldReceive('where')
            ->with('code', 'CARD')
            ->andReturnSelf();
        Department::shouldReceive('exists')
            ->andReturn(true);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Department code must be unique');

        $this->departmentService->createDepartment($data);
    }

    /** @test */
    public function it_can_update_department_with_valid_data()
    {
        $department = new Department([
            'id' => 1,
            'name' => 'Cardiology',
            'code' => 'CARD',
            'status' => 'active'
        ]);

        $updateData = ['name' => 'Cardiac Surgery'];
        $oldValues = $department->toArray();

        $department->shouldReceive('update')
            ->with($updateData)
            ->once();

        $updatedDepartment = new Department(array_merge($department->toArray(), $updateData));
        $department->shouldReceive('fresh')
            ->andReturn($updatedDepartment);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('department', 1, 'updated', $oldValues, $updatedDepartment->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('department', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->departmentService->updateDepartment($department, $updateData);

        $this->assertEquals($updatedDepartment, $result);
    }

    /** @test */
    public function it_validates_code_uniqueness_when_updating()
    {
        $department = new Department([
            'id' => 1,
            'name' => 'Cardiology',
            'code' => 'CARD'
        ]);

        $updateData = ['code' => 'NEURO']; // Different code

        // Mock that new code exists
        Department::shouldReceive('where')
            ->with('code', 'NEURO')
            ->andReturnSelf();
        Department::shouldReceive('exists')
            ->andReturn(true);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Department code must be unique');

        $this->departmentService->updateDepartment($department, $updateData);
    }

    /** @test */
    public function it_can_toggle_department_status_from_active_to_inactive()
    {
        $department = new Department([
            'id' => 1,
            'name' => 'Cardiology',
            'code' => 'CARD',
            'status' => 'active'
        ]);

        // Mock no references
        $this->masterDataService
            ->shouldReceive('validateEntityReferences')
            ->with('department', 1)
            ->andReturn([]);

        // Mock update process
        $department->shouldReceive('toArray')
            ->andReturn($department->toArray());
        
        $department->shouldReceive('update')
            ->with(['status' => 'inactive'])
            ->once();

        $updatedDepartment = new Department(array_merge($department->toArray(), ['status' => 'inactive']));
        $department->shouldReceive('fresh')
            ->andReturn($updatedDepartment);

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

        $result = $this->departmentService->toggleDepartmentStatus($department);

        $this->assertEquals('inactive', $result->status);
    }

    /** @test */
    public function it_prevents_deactivation_when_department_has_references()
    {
        $department = new Department([
            'id' => 1,
            'name' => 'Cardiology',
            'code' => 'CARD',
            'status' => 'active'
        ]);

        // Mock references exist
        $references = [
            ['message' => 'Has 5 active wards']
        ];

        $this->masterDataService
            ->shouldReceive('validateEntityReferences')
            ->with('department', 1)
            ->andReturn($references);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Cannot deactivate department with active references');

        $this->departmentService->toggleDepartmentStatus($department);
    }

    /** @test */
    public function it_can_reorder_departments()
    {
        $departmentIds = [3, 1, 2];

        Department::shouldReceive('where')
            ->with('id', 3)
            ->andReturnSelf();
        Department::shouldReceive('update')
            ->with(['sort_order' => 1])
            ->once();

        Department::shouldReceive('where')
            ->with('id', 1)
            ->andReturnSelf();
        Department::shouldReceive('update')
            ->with(['sort_order' => 2])
            ->once();

        Department::shouldReceive('where')
            ->with('id', 2)
            ->andReturnSelf();
        Department::shouldReceive('update')
            ->with(['sort_order' => 3])
            ->once();

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('department', 0, 'reordered', [], ['new_order' => $departmentIds])
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('department', 0)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->departmentService->reorderDepartments($departmentIds);

        $this->assertTrue($result);
    }

    /** @test */
    public function it_can_search_departments_with_query()
    {
        $query = 'card';
        $filters = ['status' => 'active'];

        $departments = new \Illuminate\Database\Eloquent\Collection([
            new Department(['name' => 'Cardiology', 'code' => 'CARD'])
        ]);

        Department::shouldReceive('query')
            ->andReturnSelf();
        Department::shouldReceive('where')
            ->andReturnSelf();
        Department::shouldReceive('orderBy')
            ->andReturnSelf();
        Department::shouldReceive('get')
            ->andReturn($departments);

        $result = $this->departmentService->searchDepartments($query, $filters);

        $this->assertEquals($departments, $result);
    }

    /** @test */
    public function it_can_bulk_update_department_statuses()
    {
        $departmentIds = [1, 2];
        $status = 'inactive';

        $department1 = new Department(['id' => 1, 'name' => 'Cardiology', 'status' => 'active']);
        $department2 = new Department(['id' => 2, 'name' => 'Neurology', 'status' => 'active']);

        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department1);
        Department::shouldReceive('find')
            ->with(2)
            ->andReturn($department2);

        // Mock no references for both departments
        $this->masterDataService
            ->shouldReceive('validateEntityReferences')
            ->twice()
            ->andReturn([]);

        // Mock updates
        $department1->shouldReceive('toArray')
            ->andReturn($department1->toArray());
        $department1->shouldReceive('update')
            ->with(['status' => 'inactive']);
        $department1->shouldReceive('fresh')
            ->andReturn($department1);

        $department2->shouldReceive('toArray')
            ->andReturn($department2->toArray());
        $department2->shouldReceive('update')
            ->with(['status' => 'inactive']);
        $department2->shouldReceive('fresh')
            ->andReturn($department2);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->twice();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('department', 0)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->departmentService->bulkUpdateStatus($departmentIds, $status);

        $this->assertCount(2, $results);
        $this->assertTrue($results[0]['success']);
        $this->assertTrue($results[1]['success']);
    }

    /** @test */
    public function it_handles_bulk_update_with_references()
    {
        $departmentIds = [1];
        $status = 'inactive';

        $department = new Department(['id' => 1, 'name' => 'Cardiology', 'status' => 'active']);

        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock references exist
        $references = [
            ['message' => 'Has 5 active wards']
        ];

        $this->masterDataService
            ->shouldReceive('validateEntityReferences')
            ->with('department', 1)
            ->andReturn($references);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->departmentService->bulkUpdateStatus($departmentIds, $status);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertStringContains('Has active references', $results[0]['error']);
    }

    /** @test */
    public function it_handles_department_not_found_in_bulk_update()
    {
        $departmentIds = [999]; // Non-existent ID
        $status = 'inactive';

        Department::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->departmentService->bulkUpdateStatus($departmentIds, $status);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Department not found', $results[0]['error']);
    }

    /** @test */
    public function it_rollsback_transaction_on_exception_during_creation()
    {
        $data = [
            'name' => 'Emergency Medicine',
            'code' => 'EM'
        ];

        // Mock that code doesn't exist
        Department::shouldReceive('where')
            ->with('code', 'EM')
            ->andReturnSelf();
        Department::shouldReceive('exists')
            ->andReturn(false);

        Department::shouldReceive('max')
            ->with('sort_order')
            ->andReturn(5);

        // Mock exception during creation
        Department::shouldReceive('create')
            ->andThrow(new \Exception('Database error'));

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database error');

        $this->departmentService->createDepartment($data);
    }

    /** @test */
    public function it_can_get_department_statistics()
    {
        $department = new Department(['id' => 1, 'name' => 'Cardiology']);

        Cache::shouldReceive('remember')
            ->with("master_data.department.1.stats", 1800, \Closure::class)
            ->andReturn([
                'total_wards' => 3,
                'active_wards' => 2,
                'total_beds' => 50,
                'occupied_beds' => 30,
                'total_tests' => 25
            ]);

        $stats = $this->departmentService->getDepartmentStats($department);

        $this->assertEquals(3, $stats['total_wards']);
        $this->assertEquals(2, $stats['active_wards']);
        $this->assertEquals(50, $stats['total_beds']);
        $this->assertEquals(30, $stats['occupied_beds']);
        $this->assertEquals(25, $stats['total_tests']);
    }
}