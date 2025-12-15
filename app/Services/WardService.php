<?php

namespace App\Services;

use App\Models\Ward;
use App\Models\Bed;
use App\Models\Department;
use App\Services\MasterDataService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WardService
{
    protected MasterDataService $masterDataService;
    protected MasterDataCacheService $cacheService;

    public function __construct(MasterDataService $masterDataService, MasterDataCacheService $cacheService)
    {
        $this->masterDataService = $masterDataService;
        $this->cacheService = $cacheService;
    }

    /**
     * Get all wards with beds and occupancy data
     *
     * @param array $filters
     * @return Collection
     */
    public function getWardsWithBeds(array $filters = []): Collection
    {
        $cacheKey = 'master_data.wards.with_beds';
        
        if (!empty($filters)) {
            $cacheKey .= '.' . md5(serialize($filters));
        }

        return Cache::remember($cacheKey, 1800, function () use ($filters) {
            $query = Ward::with(['department', 'beds']);

            if (isset($filters['department_id'])) {
                $query->where('department_id', $filters['department_id']);
            }

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['type'])) {
                $query->where('type', $filters['type']);
            }

            return $query->orderBy('department_id')
                        ->orderBy('name')
                        ->get()
                        ->map(function ($ward) {
                            return $this->enrichWardWithStats($ward);
                        });
        });
    }

    /**
     * Get bed occupancy matrix for visualization
     *
     * @return array
     */
    public function getBedOccupancyMatrix(): array
    {
        return Cache::remember('master_data.beds.occupancy_matrix', 900, function () {
            $wards = Ward::with(['department', 'beds'])
                        ->where('status', 'active')
                        ->orderBy('department_id')
                        ->orderBy('name')
                        ->get();

            $matrix = [];

            foreach ($wards as $ward) {
                $wardData = [
                    'id' => $ward->id,
                    'name' => $ward->name,
                    'department' => $ward->department->name,
                    'type' => $ward->type,
                    'capacity' => $ward->capacity,
                    'occupancy_rate' => $this->calculateWardOccupancy($ward),
                    'beds' => []
                ];

                foreach ($ward->beds as $bed) {
                    $wardData['beds'][] = [
                        'id' => $bed->id,
                        'bed_number' => $bed->bed_number,
                        'bed_type' => $bed->bed_type,
                        'status' => $bed->status,
                        'last_occupied_at' => $bed->last_occupied_at,
                        'maintenance_notes' => $bed->maintenance_notes,
                    ];
                }

                $matrix[] = $wardData;
            }

            return $matrix;
        });
    }

    /**
     * Create a new ward
     *
     * @param array $data
     * @return Ward
     * @throws ValidationException
     */
    public function createWard(array $data): Ward
    {
        // Validate department exists and is active
        $this->validateDepartment($data['department_id']);

        // Validate capacity
        $this->validateWardCapacity($data['capacity']);

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        DB::beginTransaction();

        try {
            $ward = Ward::create($data);

            $this->masterDataService->logMasterDataChange(
                'ward',
                $ward->id,
                'created',
                [],
                $ward->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('ward', $ward->id);

            DB::commit();

            return $ward;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing ward
     *
     * @param Ward $ward
     * @param array $data
     * @return Ward
     * @throws ValidationException
     */
    public function updateWard(Ward $ward, array $data): Ward
    {
        // Validate department if being changed
        if (isset($data['department_id']) && $data['department_id'] !== $ward->department_id) {
            $this->validateDepartment($data['department_id']);
        }

        // Validate capacity if being changed
        if (isset($data['capacity'])) {
            $this->validateWardCapacity($data['capacity'], $ward);
        }

        $oldValues = $ward->toArray();

        DB::beginTransaction();

        try {
            $ward->update($data);

            $this->masterDataService->logMasterDataChange(
                'ward',
                $ward->id,
                'updated',
                $oldValues,
                $ward->fresh()->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('ward', $ward->id);

            DB::commit();

            return $ward->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create a new bed in a ward
     *
     * @param array $data
     * @return Bed
     * @throws ValidationException
     */
    public function createBed(array $data): Bed
    {
        // Validate ward exists and has capacity
        $ward = Ward::find($data['ward_id']);
        if (!$ward) {
            throw ValidationException::withMessages([
                'ward_id' => 'Ward not found'
            ]);
        }

        $this->validateBedCapacity($ward);
        $this->validateBedNumber($data['bed_number'], $data['ward_id']);

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'available';
        }

        DB::beginTransaction();

        try {
            $bed = Bed::create($data);

            $this->masterDataService->logMasterDataChange(
                'bed',
                $bed->id,
                'created',
                [],
                $bed->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('bed', $bed->id);

            DB::commit();

            return $bed;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update bed status and related information
     *
     * @param Bed $bed
     * @param string $status
     * @param array $additionalData
     * @return Bed
     */
    public function updateBedStatus(Bed $bed, string $status, array $additionalData = []): Bed
    {
        $oldValues = $bed->toArray();
        
        $updateData = array_merge($additionalData, ['status' => $status]);

        // Set timestamps based on status
        if ($status === 'occupied' && $bed->status !== 'occupied') {
            $updateData['last_occupied_at'] = now();
        }

        DB::beginTransaction();

        try {
            $bed->update($updateData);

            $this->masterDataService->logMasterDataChange(
                'bed',
                $bed->id,
                'status_changed',
                $oldValues,
                $bed->fresh()->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('bed', $bed->id);

            DB::commit();

            return $bed->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Calculate ward occupancy percentage
     *
     * @param Ward $ward
     * @return float
     */
    public function calculateWardOccupancy(Ward $ward): float
    {
        $totalBeds = $ward->beds()->whereIn('status', ['available', 'occupied', 'reserved'])->count();
        
        if ($totalBeds === 0) {
            return 0.0;
        }

        $occupiedBeds = $ward->beds()->whereIn('status', ['occupied', 'reserved'])->count();
        
        return round(($occupiedBeds / $totalBeds) * 100, 2);
    }

    /**
     * Get available beds in a ward
     *
     * @param Ward $ward
     * @return Collection
     */
    public function getAvailableBeds(Ward $ward): Collection
    {
        return $ward->beds()
                   ->where('status', 'available')
                   ->orderBy('bed_number')
                   ->get();
    }

    /**
     * Bulk update bed statuses
     *
     * @param array $bedUpdates Array of ['bed_id' => id, 'status' => status, 'data' => additional_data]
     * @return array
     */
    public function bulkUpdateBedStatuses(array $bedUpdates): array
    {
        $results = [];

        DB::beginTransaction();

        try {
            foreach ($bedUpdates as $update) {
                $bed = Bed::find($update['bed_id']);
                
                if (!$bed) {
                    $results[] = [
                        'bed_id' => $update['bed_id'],
                        'success' => false,
                        'error' => 'Bed not found'
                    ];
                    continue;
                }

                $oldValues = $bed->toArray();
                $updateData = array_merge($update['data'] ?? [], ['status' => $update['status']]);

                // Set timestamps based on status
                if ($update['status'] === 'occupied' && $bed->status !== 'occupied') {
                    $updateData['last_occupied_at'] = now();
                }

                $bed->update($updateData);

                $this->masterDataService->logMasterDataChange(
                    'bed',
                    $bed->id,
                    'status_changed',
                    $oldValues,
                    $bed->fresh()->toArray()
                );

                $results[] = [
                    'bed_id' => $update['bed_id'],
                    'success' => true
                ];
            }

            $this->masterDataService->invalidateRelatedCaches('bed', 0);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    /**
     * Get ward occupancy statistics
     *
     * @param Ward|null $ward
     * @return array
     */
    public function getOccupancyStats(?Ward $ward = null): array
    {
        $cacheKey = $ward ? "master_data.ward.{$ward->wardid}.occupancy_stats" : 'master_data.wards.occupancy_stats';

        return Cache::remember($cacheKey, 900, function () use ($ward) {
            $query = $ward ? $ward->beds() : Bed::query();

            $stats = [
                'total_beds' => $query->count(),
                'available' => $query->where('status', 'available')->count(),
                'occupied' => $query->where('status', 'occupied')->count(),
                'maintenance' => $query->where('status', 'maintenance')->count(),
                'reserved' => $query->where('status', 'reserved')->count(),
                'out_of_order' => $query->where('status', 'out_of_order')->count(),
            ];

            $stats['occupancy_rate'] = $stats['total_beds'] > 0 
                ? round((($stats['occupied'] + $stats['reserved']) / $stats['total_beds']) * 100, 2)
                : 0.0;

            return $stats;
        });
    }

    /**
     * Search wards and beds
     *
     * @param string $query
     * @param array $filters
     * @return Collection
     */
    public function searchWardsAndBeds(string $query, array $filters = []): Collection
    {
        $searchQuery = Ward::with(['department', 'beds']);

        // Text search
        if (!empty($query)) {
            $searchQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%")
                  ->orWhereHas('beds', function ($bedQuery) use ($query) {
                      $bedQuery->where('bed_number', 'like', "%{$query}%");
                  });
            });
        }

        // Apply filters
        if (isset($filters['department_id'])) {
            $searchQuery->where('department_id', $filters['department_id']);
        }

        if (isset($filters['ward_type'])) {
            $searchQuery->where('type', $filters['ward_type']);
        }

        if (isset($filters['bed_status'])) {
            $searchQuery->whereHas('beds', function ($bedQuery) use ($filters) {
                $bedQuery->where('status', $filters['bed_status']);
            });
        }

        if (isset($filters['occupancy_threshold'])) {
            $searchQuery->get()->filter(function ($ward) use ($filters) {
                $occupancy = $this->calculateWardOccupancy($ward);
                return $occupancy >= $filters['occupancy_threshold'];
            });
        }

        return $searchQuery->orderBy('department_id')
                          ->orderBy('name')
                          ->get()
                          ->map(function ($ward) {
                              return $this->enrichWardWithStats($ward);
                          });
    }

    /**
     * Enrich ward data with calculated statistics
     *
     * @param Ward $ward
     * @return Ward
     */
    protected function enrichWardWithStats(Ward $ward): Ward
    {
        $ward->occupancy_rate = $this->calculateWardOccupancy($ward);
        $ward->available_beds_count = $ward->beds()->where('status', 'available')->count();
        $ward->occupied_beds_count = $ward->beds()->where('status', 'occupied')->count();
        $ward->maintenance_beds_count = $ward->beds()->where('status', 'maintenance')->count();
        
        return $ward;
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
                'department_id' => 'Cannot assign ward to inactive department'
            ]);
        }
    }

    /**
     * Validate ward capacity
     *
     * @param int $capacity
     * @param Ward|null $ward
     * @throws ValidationException
     */
    protected function validateWardCapacity(int $capacity, ?Ward $ward = null): void
    {
        if ($capacity <= 0) {
            throw ValidationException::withMessages([
                'capacity' => 'Ward capacity must be greater than 0'
            ]);
        }

        // If updating existing ward, check current bed count
        if ($ward && $ward->beds()->count() > $capacity) {
            throw ValidationException::withMessages([
                'capacity' => 'Cannot reduce capacity below current bed count (' . $ward->beds()->count() . ')'
            ]);
        }
    }

    /**
     * Validate bed capacity against ward limits
     *
     * @param Ward $ward
     * @throws ValidationException
     */
    protected function validateBedCapacity(Ward $ward): void
    {
        $currentBedCount = $ward->beds()->count();
        
        if ($currentBedCount >= $ward->capacity) {
            throw ValidationException::withMessages([
                'ward_id' => "Ward has reached maximum capacity ({$ward->capacity} beds)"
            ]);
        }
    }

    /**
     * Validate bed number uniqueness within ward
     *
     * @param string $bedNumber
     * @param int $wardId
     * @param int|null $excludeBedId
     * @throws ValidationException
     */
    protected function validateBedNumber(string $bedNumber, int $wardId, ?int $excludeBedId = null): void
    {
        $query = Bed::where('ward_id', $wardId)->where('bed_number', $bedNumber);
        
        if ($excludeBedId) {
            $query->where('id', '!=', $excludeBedId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'bed_number' => 'Bed number must be unique within the ward'
            ]);
        }
    }
}