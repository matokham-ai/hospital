<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\WardService;
use App\Services\MasterDataService;
use App\Services\MasterDataCacheService;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\Department;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Mockery;

class WardServiceTest extends TestCase
{
    protected WardService $wardService;
    protected $masterDataService;
    protected $cacheService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->masterDataService = Mockery::mock(MasterDataService::class);
        $this->cacheService = Mockery::mock(MasterDataCacheService::class);
        
        $this->wardService = new WardService(
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
    public function it_can_get_wards_with_beds_without_filters()
    {
        $wards = collect([
            new Ward(['id' => 1, 'name' => 'ICU', 'department_id' => 1]),
            new Ward(['id' => 2, 'name' => 'General Ward', 'department_id' => 1])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.wards.with_beds', 1800, \Closure::class)
            ->andReturn($wards);

        Ward::shouldReceive('with')
            ->with(['department', 'beds'])
            ->andReturnSelf();
        Ward::shouldReceive('orderBy')
            ->with('department_id')
            ->andReturnSelf();
        Ward::shouldReceive('orderBy')
            ->with('name')
            ->andReturnSelf();
        Ward::shouldReceive('get')
            ->andReturn($wards);

        $result = $this->wardService->getWardsWithBeds();

        $this->assertEquals($wards, $result);
    }

    /** @test */
    public function it_can_get_wards_with_department_filter()
    {
        $filters = ['department_id' => 1];
        $wards = collect([
            new Ward(['id' => 1, 'name' => 'ICU', 'department_id' => 1])
        ]);

        Cache::shouldReceive('remember')
            ->with('master_data.wards.with_beds.' . md5(serialize($filters)), 1800, \Closure::class)
            ->andReturn($wards);

        Ward::shouldReceive('with')
            ->with(['department', 'beds'])
            ->andReturnSelf();
        Ward::shouldReceive('where')
            ->with('department_id', 1)
            ->andReturnSelf();
        Ward::shouldReceive('orderBy')
            ->andReturnSelf();
        Ward::shouldReceive('get')
            ->andReturn($wards);

        $result = $this->wardService->getWardsWithBeds($filters);

        $this->assertEquals($wards, $result);
    }

    /** @test */
    public function it_can_create_ward_with_valid_data()
    {
        $data = [
            'name' => 'Emergency Ward',
            'department_id' => 1,
            'type' => 'general',
            'capacity' => 20,
            'description' => 'Emergency department ward'
        ];

        // Mock department validation
        $department = new Department(['id' => 1, 'name' => 'Emergency', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock ward creation
        $ward = new Ward(array_merge($data, ['status' => 'active']));
        $ward->id = 1;
        
        Ward::shouldReceive('create')
            ->with(array_merge($data, ['status' => 'active']))
            ->andReturn($ward);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('ward', 1, 'created', [], $ward->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('ward', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->wardService->createWard($data);

        $this->assertEquals($ward, $result);
        $this->assertEquals('active', $result->status);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_department()
    {
        $data = [
            'name' => 'Emergency Ward',
            'department_id' => 999, // Non-existent department
            'capacity' => 20
        ];

        Department::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Department not found');

        $this->wardService->createWard($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_inactive_department()
    {
        $data = [
            'name' => 'Emergency Ward',
            'department_id' => 1,
            'capacity' => 20
        ];

        $department = new Department(['id' => 1, 'name' => 'Emergency', 'status' => 'inactive']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Cannot assign ward to inactive department');

        $this->wardService->createWard($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_invalid_capacity()
    {
        $data = [
            'name' => 'Emergency Ward',
            'department_id' => 1,
            'capacity' => 0 // Invalid capacity
        ];

        $department = new Department(['id' => 1, 'name' => 'Emergency', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Ward capacity must be greater than 0');

        $this->wardService->createWard($data);
    }

    /** @test */
    public function it_can_update_ward_with_valid_data()
    {
        $ward = new Ward([
            'id' => 1,
            'name' => 'ICU',
            'department_id' => 1,
            'capacity' => 10
        ]);

        $updateData = ['name' => 'Intensive Care Unit'];
        $oldValues = $ward->toArray();

        $ward->shouldReceive('update')
            ->with($updateData)
            ->once();

        $updatedWard = new Ward(array_merge($ward->toArray(), $updateData));
        $ward->shouldReceive('fresh')
            ->andReturn($updatedWard);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('ward', 1, 'updated', $oldValues, $updatedWard->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('ward', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->wardService->updateWard($ward, $updateData);

        $this->assertEquals($updatedWard, $result);
    }

    /** @test */
    public function it_validates_capacity_reduction_against_existing_beds()
    {
        $ward = new Ward([
            'id' => 1,
            'name' => 'ICU',
            'capacity' => 10
        ]);

        // Mock beds count
        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(8); // 8 existing beds

        $updateData = ['capacity' => 5]; // Trying to reduce to 5

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Cannot reduce capacity below current bed count (8)');

        $this->wardService->updateWard($ward, $updateData);
    }

    /** @test */
    public function it_can_create_bed_with_valid_data()
    {
        $data = [
            'ward_id' => 1,
            'bed_number' => 'B001',
            'bed_type' => 'standard'
        ];

        // Mock ward validation
        $ward = new Ward(['id' => 1, 'name' => 'ICU', 'capacity' => 10]);
        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(5); // Current bed count

        Ward::shouldReceive('find')
            ->with(1)
            ->andReturn($ward);

        // Mock bed number uniqueness check
        Bed::shouldReceive('where')
            ->with('ward_id', 1)
            ->andReturnSelf();
        Bed::shouldReceive('where')
            ->with('bed_number', 'B001')
            ->andReturnSelf();
        Bed::shouldReceive('exists')
            ->andReturn(false);

        // Mock bed creation
        $bed = new Bed(array_merge($data, ['status' => 'available']));
        $bed->id = 1;
        
        Bed::shouldReceive('create')
            ->with(array_merge($data, ['status' => 'available']))
            ->andReturn($bed);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('bed', 1, 'created', [], $bed->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('bed', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->wardService->createBed($data);

        $this->assertEquals($bed, $result);
        $this->assertEquals('available', $result->status);
    }

    /** @test */
    public function it_throws_validation_exception_when_ward_at_capacity()
    {
        $data = [
            'ward_id' => 1,
            'bed_number' => 'B001',
            'bed_type' => 'standard'
        ];

        // Mock ward at capacity
        $ward = new Ward(['id' => 1, 'name' => 'ICU', 'capacity' => 10]);
        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(10); // At capacity

        Ward::shouldReceive('find')
            ->with(1)
            ->andReturn($ward);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Ward has reached maximum capacity (10 beds)');

        $this->wardService->createBed($data);
    }

    /** @test */
    public function it_throws_validation_exception_for_duplicate_bed_number()
    {
        $data = [
            'ward_id' => 1,
            'bed_number' => 'B001',
            'bed_type' => 'standard'
        ];

        // Mock ward validation
        $ward = new Ward(['id' => 1, 'name' => 'ICU', 'capacity' => 10]);
        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(5);

        Ward::shouldReceive('find')
            ->with(1)
            ->andReturn($ward);

        // Mock duplicate bed number
        Bed::shouldReceive('where')
            ->with('ward_id', 1)
            ->andReturnSelf();
        Bed::shouldReceive('where')
            ->with('bed_number', 'B001')
            ->andReturnSelf();
        Bed::shouldReceive('exists')
            ->andReturn(true);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Bed number must be unique within the ward');

        $this->wardService->createBed($data);
    }

    /** @test */
    public function it_can_update_bed_status()
    {
        $bed = new Bed([
            'id' => 1,
            'ward_id' => 1,
            'bed_number' => 'B001',
            'status' => 'available'
        ]);

        $newStatus = 'occupied';
        $additionalData = ['patient_id' => 123];
        $oldValues = $bed->toArray();

        $bed->shouldReceive('update')
            ->with(array_merge($additionalData, [
                'status' => $newStatus,
                'last_occupied_at' => \Mockery::type(\Carbon\Carbon::class)
            ]))
            ->once();

        $updatedBed = new Bed(array_merge($bed->toArray(), ['status' => $newStatus]));
        $bed->shouldReceive('fresh')
            ->andReturn($updatedBed);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->with('bed', 1, 'status_changed', $oldValues, $updatedBed->toArray())
            ->once();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('bed', 1)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $result = $this->wardService->updateBedStatus($bed, $newStatus, $additionalData);

        $this->assertEquals($updatedBed, $result);
    }

    /** @test */
    public function it_can_calculate_ward_occupancy()
    {
        $ward = new Ward(['id' => 1, 'name' => 'ICU']);

        // Mock beds query
        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('whereIn')
            ->with('status', ['available', 'occupied', 'reserved'])
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(10); // Total beds

        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('whereIn')
            ->with('status', ['occupied', 'reserved'])
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(7); // Occupied beds

        $occupancy = $this->wardService->calculateWardOccupancy($ward);

        $this->assertEquals(70.0, $occupancy);
    }

    /** @test */
    public function it_returns_zero_occupancy_for_ward_with_no_beds()
    {
        $ward = new Ward(['id' => 1, 'name' => 'ICU']);

        // Mock no beds
        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('whereIn')
            ->with('status', ['available', 'occupied', 'reserved'])
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(0);

        $occupancy = $this->wardService->calculateWardOccupancy($ward);

        $this->assertEquals(0.0, $occupancy);
    }

    /** @test */
    public function it_can_get_available_beds()
    {
        $ward = new Ward(['id' => 1, 'name' => 'ICU']);
        $availableBeds = collect([
            new Bed(['id' => 1, 'bed_number' => 'B001', 'status' => 'available']),
            new Bed(['id' => 2, 'bed_number' => 'B002', 'status' => 'available'])
        ]);

        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('where')
            ->with('status', 'available')
            ->andReturnSelf();
        $ward->shouldReceive('orderBy')
            ->with('bed_number')
            ->andReturnSelf();
        $ward->shouldReceive('get')
            ->andReturn($availableBeds);

        $result = $this->wardService->getAvailableBeds($ward);

        $this->assertEquals($availableBeds, $result);
    }

    /** @test */
    public function it_can_bulk_update_bed_statuses()
    {
        $bedUpdates = [
            ['bed_id' => 1, 'status' => 'occupied', 'data' => ['patient_id' => 123]],
            ['bed_id' => 2, 'status' => 'maintenance', 'data' => ['notes' => 'Cleaning']]
        ];

        $bed1 = new Bed(['id' => 1, 'status' => 'available']);
        $bed2 = new Bed(['id' => 2, 'status' => 'available']);

        Bed::shouldReceive('find')
            ->with(1)
            ->andReturn($bed1);
        Bed::shouldReceive('find')
            ->with(2)
            ->andReturn($bed2);

        // Mock updates
        $bed1->shouldReceive('toArray')
            ->andReturn($bed1->toArray());
        $bed1->shouldReceive('update')
            ->with(['patient_id' => 123, 'status' => 'occupied', 'last_occupied_at' => \Mockery::type(\Carbon\Carbon::class)]);
        $bed1->shouldReceive('fresh')
            ->andReturn($bed1);

        $bed2->shouldReceive('toArray')
            ->andReturn($bed2->toArray());
        $bed2->shouldReceive('update')
            ->with(['notes' => 'Cleaning', 'status' => 'maintenance']);
        $bed2->shouldReceive('fresh')
            ->andReturn($bed2);

        // Mock audit logging
        $this->masterDataService
            ->shouldReceive('logMasterDataChange')
            ->twice();

        // Mock cache invalidation
        $this->masterDataService
            ->shouldReceive('invalidateRelatedCaches')
            ->with('bed', 0)
            ->once();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->wardService->bulkUpdateBedStatuses($bedUpdates);

        $this->assertCount(2, $results);
        $this->assertTrue($results[0]['success']);
        $this->assertTrue($results[1]['success']);
    }

    /** @test */
    public function it_handles_bed_not_found_in_bulk_update()
    {
        $bedUpdates = [
            ['bed_id' => 999, 'status' => 'occupied'] // Non-existent bed
        ];

        Bed::shouldReceive('find')
            ->with(999)
            ->andReturn(null);

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();

        $results = $this->wardService->bulkUpdateBedStatuses($bedUpdates);

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('Bed not found', $results[0]['error']);
    }

    /** @test */
    public function it_can_get_occupancy_stats_for_specific_ward()
    {
        $ward = new Ward(['id' => 1, 'name' => 'ICU']);

        Cache::shouldReceive('remember')
            ->with("master_data.ward.1.occupancy_stats", 900, \Closure::class)
            ->andReturn([
                'total_beds' => 10,
                'available' => 3,
                'occupied' => 6,
                'maintenance' => 1,
                'reserved' => 0,
                'out_of_order' => 0,
                'occupancy_rate' => 60.0
            ]);

        $ward->shouldReceive('beds')
            ->andReturnSelf();
        $ward->shouldReceive('count')
            ->andReturn(10);
        $ward->shouldReceive('where')
            ->andReturnSelf();

        $stats = $this->wardService->getOccupancyStats($ward);

        $this->assertEquals(10, $stats['total_beds']);
        $this->assertEquals(6, $stats['occupied']);
        $this->assertEquals(60.0, $stats['occupancy_rate']);
    }

    /** @test */
    public function it_can_get_occupancy_stats_for_all_wards()
    {
        Cache::shouldReceive('remember')
            ->with('master_data.wards.occupancy_stats', 900, \Closure::class)
            ->andReturn([
                'total_beds' => 50,
                'available' => 20,
                'occupied' => 25,
                'maintenance' => 3,
                'reserved' => 2,
                'out_of_order' => 0,
                'occupancy_rate' => 54.0
            ]);

        Bed::shouldReceive('query')
            ->andReturnSelf();
        Bed::shouldReceive('count')
            ->andReturn(50);
        Bed::shouldReceive('where')
            ->andReturnSelf();

        $stats = $this->wardService->getOccupancyStats();

        $this->assertEquals(50, $stats['total_beds']);
        $this->assertEquals(25, $stats['occupied']);
        $this->assertEquals(54.0, $stats['occupancy_rate']);
    }

    /** @test */
    public function it_rollsback_transaction_on_exception_during_ward_creation()
    {
        $data = [
            'name' => 'Emergency Ward',
            'department_id' => 1,
            'capacity' => 20
        ];

        // Mock department validation
        $department = new Department(['id' => 1, 'name' => 'Emergency', 'status' => 'active']);
        Department::shouldReceive('find')
            ->with(1)
            ->andReturn($department);

        // Mock exception during creation
        Ward::shouldReceive('create')
            ->andThrow(new \Exception('Database error'));

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database error');

        $this->wardService->createWard($data);
    }
}