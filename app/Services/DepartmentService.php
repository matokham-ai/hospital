<?php

namespace App\Services;

use App\Models\Department;
use App\Services\MasterDataService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DepartmentService
{
    protected MasterDataService $masterDataService;
    protected MasterDataCacheService $cacheService;

    public function __construct(MasterDataService $masterDataService, MasterDataCacheService $cacheService)
    {
        $this->masterDataService = $masterDataService;
        $this->cacheService = $cacheService;
    }

    /**
     * Get all departments with optional filtering
     *
     * @param array $filters
     * @return Collection
     */
    public function getAllDepartments(array $filters = []): Collection
    {
        // Use cache service for simple cases, direct query for complex filters
        if (empty($filters)) {
            return $this->cacheService->getDepartments(false);
        }
        
        if (isset($filters['status']) && $filters['status'] === 'active' && count($filters) === 1) {
            return $this->cacheService->getDepartments(true);
        }

        // For complex filters, use direct query with caching
        $cacheKey = 'master_data.departments.filtered.' . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 1800, function () use ($filters) {
            $query = Department::query();

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            return $query->orderBy('sort_order')
                        ->orderBy('name')
                        ->get();
        });
    }

    /**
     * Get active departments for dropdowns and references
     *
     * @return Collection
     */
    public function getActiveDepartments(): Collection
    {
        return $this->cacheService->getDepartments(true);
    }

    /**
     * Create a new department
     *
     * @param array $data
     * @return Department
     * @throws ValidationException
     */
    public function createDepartment(array $data): Department
    {
        // Validate code uniqueness
        $this->validateDepartmentCode($data['code']);

        // Generate deptid if not provided
        if (!isset($data['deptid'])) {
            $data['deptid'] = $this->generateDepartmentId($data['code']);
        }

        // Set default sort order if not provided
        if (!isset($data['sort_order'])) {
            $data['sort_order'] = Department::max('sort_order') + 1;
        }

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        DB::beginTransaction();

        try {
            $department = Department::create($data);

            $this->masterDataService->logMasterDataChange(
                'department',
                $department->deptid,
                'created',
                [],
                $department->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('department', $department->deptid);

            DB::commit();

            return $department;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing department
     *
     * @param Department $department
     * @param array $data
     * @return Department
     * @throws ValidationException
     */
    public function updateDepartment(Department $department, array $data): Department
    {
        // Validate code uniqueness if code is being changed
        if (isset($data['code']) && $data['code'] !== $department->code) {
            $this->validateDepartmentCode($data['code'], $department->deptid);
        }

        $oldValues = $department->toArray();

        DB::beginTransaction();

        try {
            $department->update($data);

            $this->masterDataService->logMasterDataChange(
                'department',
                $department->deptid,
                'updated',
                $oldValues,
                $department->fresh()->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('department', $department->deptid);

            DB::commit();

            return $department->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Toggle department status (active/inactive)
     *
     * @param Department $department
     * @return Department
     * @throws ValidationException
     */
    public function toggleDepartmentStatus(Department $department): Department
    {
        $newStatus = $department->status === 'active' ? 'inactive' : 'active';

        // Check references before deactivating
        if ($newStatus === 'inactive') {
            $references = $this->checkDepartmentReferences($department);
            if (!empty($references)) {
                throw ValidationException::withMessages([
                    'status' => 'Cannot deactivate department with active references: ' . 
                               implode(', ', array_column($references, 'message'))
                ]);
            }
        }

        return $this->updateDepartment($department, ['status' => $newStatus]);
    }

    /**
     * Deactivate a department (soft delete alternative)
     *
     * @param Department $department
     * @return bool
     * @throws ValidationException
     */
    public function deactivateDepartment(Department $department): bool
    {
        // Check for active references
        $references = $this->checkDepartmentReferences($department);
        
        if (!empty($references)) {
            throw ValidationException::withMessages([
                'department' => 'Cannot deactivate department with active references: ' . 
                               implode(', ', array_column($references, 'message'))
            ]);
        }

        $oldValues = $department->toArray();

        DB::beginTransaction();

        try {
            $department->update(['status' => 'inactive']);

            $this->masterDataService->logMasterDataChange(
                'department',
                $department->deptid,
                'status_changed',
                $oldValues,
                $department->fresh()->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('department', $department->deptid);

            DB::commit();

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Check department references before deletion/deactivation
     *
     * @param Department $department
     * @return array
     */
    public function checkDepartmentReferences(Department $department): array
    {
        return $this->masterDataService->validateEntityReferences('department', $department->deptid);
    }

    /**
     * Reorder departments by updating sort_order
     *
     * @param array $departmentIds Array of department IDs in new order
     * @return bool
     */
    public function reorderDepartments(array $departmentIds): bool
    {
        DB::beginTransaction();

        try {
            foreach ($departmentIds as $index => $departmentId) {
                Department::where('deptid', $departmentId)
                         ->update(['sort_order' => $index + 1]);
            }

            $this->masterDataService->logMasterDataChange(
                'department',
                0,
                'reordered',
                [],
                ['new_order' => $departmentIds]
            );

            $this->masterDataService->invalidateRelatedCaches('department', 0);

            DB::commit();

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get department statistics
     *
     * @param Department $department
     * @return array
     */
    public function getDepartmentStats(Department $department): array
    {
        return Cache::remember("master_data.department.{$department->deptid}.stats", 1800, function () use ($department) {
            return [
                'total_wards' => $department->wards()->count(),
                'active_wards' => $department->wards()->where('status', 'active')->count(),
                'total_beds' => $department->wards()->withCount('beds')->get()->sum('beds_count'),
                'occupied_beds' => $department->wards()
                                            ->with('beds')
                                            ->get()
                                            ->flatMap->beds
                                            ->where('status', 'occupied')
                                            ->count(),
                'total_tests' => $department->testCatalogs()->where('status', 'active')->count(),
                'created_at' => $department->created_at,
                'last_updated' => $department->updated_at,
            ];
        });
    }

    /**
     * Search departments with advanced filtering
     *
     * @param string $query
     * @param array $filters
     * @return Collection
     */
    public function searchDepartments(string $query, array $filters = []): Collection
    {
        $searchQuery = Department::query();

        // Text search
        if (!empty($query)) {
            $searchQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            });
        }

        // Apply filters
        if (isset($filters['status'])) {
            $searchQuery->where('status', $filters['status']);
        }

        if (isset($filters['has_wards'])) {
            if ($filters['has_wards']) {
                $searchQuery->has('wards');
            } else {
                $searchQuery->doesntHave('wards');
            }
        }

        if (isset($filters['has_tests'])) {
            if ($filters['has_tests']) {
                $searchQuery->has('testCatalogs');
            } else {
                $searchQuery->doesntHave('testCatalogs');
            }
        }

        return $searchQuery->orderBy('sort_order')
                          ->orderBy('name')
                          ->get();
    }

    /**
     * Generate a unique department ID based on code
     *
     * @param string $code
     * @return string
     */
    protected function generateDepartmentId(string $code): string
    {
        // Use the code as base, ensure it's uppercase and clean
        $baseId = strtoupper(preg_replace('/[^A-Z0-9]/', '', $code));
        
        // If the base ID is available, use it
        if (!Department::where('deptid', $baseId)->exists()) {
            return $baseId;
        }
        
        // If not available, append a number
        $counter = 1;
        do {
            $deptid = $baseId . sprintf('%02d', $counter);
            $counter++;
        } while (Department::where('deptid', $deptid)->exists() && $counter <= 99);
        
        if ($counter > 99) {
            // Fallback to timestamp-based ID if all numbered variants are taken
            $deptid = $baseId . substr(time(), -4);
        }
        
        return $deptid;
    }

    /**
     * Validate department code uniqueness
     *
     * @param string $code
     * @param string|null $excludeDeptId
     * @throws ValidationException
     */
    protected function validateDepartmentCode(string $code, ?string $excludeDeptId = null): void
    {
        $query = Department::where('code', $code);
        
        if ($excludeDeptId) {
            $query->where('deptid', '!=', $excludeDeptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'code' => 'Department code must be unique. This code is already in use.'
            ]);
        }
    }

    /**
     * Bulk update department statuses
     *
     * @param array $departmentIds
     * @param string $status
     * @return array
     */
    public function bulkUpdateStatus(array $departmentIds, string $status): array
    {
        $results = [];

        DB::beginTransaction();

        try {
            foreach ($departmentIds as $departmentId) {
                $department = Department::where('deptid', $departmentId)->first();
                
                if (!$department) {
                    $results[] = [
                        'id' => $departmentId,
                        'success' => false,
                        'error' => 'Department not found'
                    ];
                    continue;
                }

                // Check references if deactivating
                if ($status === 'inactive') {
                    $references = $this->checkDepartmentReferences($department);
                    if (!empty($references)) {
                        $results[] = [
                            'id' => $departmentId,
                            'success' => false,
                            'error' => 'Has active references: ' . implode(', ', array_column($references, 'message'))
                        ];
                        continue;
                    }
                }

                $oldValues = $department->toArray();
                $department->update(['status' => $status]);

                $this->masterDataService->logMasterDataChange(
                    'department',
                    $department->deptid,
                    'status_changed',
                    $oldValues,
                    $department->fresh()->toArray()
                );

                $results[] = [
                    'id' => $departmentId,
                    'success' => true
                ];
            }

            $this->masterDataService->invalidateRelatedCaches('department', 0);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    /**
     * Import departments from CSV/Excel file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    public function importFromCsv($file): array
    {
        try {
            $import = new \App\Imports\DepartmentImport();
            
            DB::beginTransaction();
            
            \Maatwebsite\Excel\Facades\Excel::import($import, $file);
            
            // Log the import operation
            $this->masterDataService->logMasterDataChange(
                'department',
                0,
                'bulk_imported',
                [],
                [
                    'imported_count' => $import->getImportedCount(),
                    'skipped_count' => $import->getSkippedCount(),
                    'file_name' => $file->getClientOriginalName()
                ]
            );

            // Invalidate department caches
            $this->masterDataService->invalidateRelatedCaches('department', 0);
            
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
}