<?php

namespace App\Services;

use App\Models\MasterDataAudit;
use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Collection;

class MasterDataService
{
    protected MasterDataCacheService $cacheService;
    
    public function __construct(MasterDataCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }
    /**
     * Entity type mappings for reference checking
     */
    protected array $entityMappings = [
        'department' => Department::class,
        'ward' => Ward::class,
        'bed' => Bed::class,
        'test_catalog' => TestCatalog::class,
        'drug_formulary' => DrugFormulary::class,
    ];

    /**
     * Reference relationships for each entity type
     */
    protected array $referenceRelationships = [
        'department' => [
            'wards' => Ward::class,
            'testCatalogs' => TestCatalog::class,
        ],
        'ward' => [
            'beds' => Bed::class,
        ],
        'test_catalog' => [
            // Add relationships when orders/results are implemented
        ],
        'drug_formulary' => [
            // Add relationships when prescriptions are implemented
        ],
    ];

    /**
     * Validate entity references before deletion
     *
     * @param string $entityType
     * @param int $entityId
     * @return array Array of reference violations
     */
    public function validateEntityReferences(string $entityType, $entityId): array
    {
        $violations = [];
        
        if (!isset($this->referenceRelationships[$entityType])) {
            return $violations;
        }

        $modelClass = $this->entityMappings[$entityType];
        
        // Handle different primary key types
        if ($entityType === 'department') {
            $entity = $modelClass::where('deptid', $entityId)->first();
        } else {
            $entity = $modelClass::find($entityId);
        }
        
        if (!$entity) {
            return $violations;
        }

        foreach ($this->referenceRelationships[$entityType] as $relationName => $relatedClass) {
            $count = $entity->{$relationName}()->count();
            
            if ($count > 0) {
                $violations[] = [
                    'relationship' => $relationName,
                    'count' => $count,
                    'message' => "Cannot delete {$entityType} because it has {$count} related {$relationName}",
                ];
            }
        }

        return $violations;
    }

    /**
     * Log master data changes for audit trail
     *
     * @param string $entityType
     * @param int $entityId
     * @param array $newValues
     * @param string $action
     * @param array $oldValues
     * @return void
     */
    public function logMasterDataChange(
        string $entityType,
        $entityId,
        string $action,
        array $oldValues = [],
        array $newValues = []
    ): void {
        MasterDataAudit::create([
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'user_id' => Auth::id(),
        ]);
    }

    /**
     * Invalidate related caches when master data changes
     *
     * @param string $entityType
     * @param int $entityId
     * @return void
     */
    public function invalidateRelatedCaches(string $entityType, $entityId): void
    {
        // Use the dedicated cache service for invalidation
        switch ($entityType) {
            case 'department':
                $this->cacheService->invalidateDepartmentCaches($entityId);
                break;
            case 'ward':
            case 'bed':
                $wardId = $entityType === 'ward' ? $entityId : null;
                $this->cacheService->invalidateWardBedCaches($wardId);
                break;
            case 'test_catalog':
                $this->cacheService->invalidateTestCatalogCaches($entityId);
                break;
            case 'drug_formulary':
                $this->cacheService->invalidateDrugFormularyCaches($entityId);
                break;
        }
    }

    /**
     * Export entity data for reporting
     *
     * @param string $entityType
     * @param array $filters
     * @return Collection
     */
    public function exportEntityData(string $entityType, array $filters = []): Collection
    {
        if (!isset($this->entityMappings[$entityType])) {
            throw new \InvalidArgumentException("Unknown entity type: {$entityType}");
        }

        $modelClass = $this->entityMappings[$entityType];
        $query = $modelClass::query();

        // Apply common filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['created_after'])) {
            $query->where('created_at', '>=', $filters['created_after']);
        }

        if (isset($filters['created_before'])) {
            $query->where('created_at', '<=', $filters['created_before']);
        }

        // Apply entity-specific filters and relationships
        switch ($entityType) {
            case 'ward':
                $query->with('department');
                if (isset($filters['department_id'])) {
                    $query->where('department_id', $filters['department_id']);
                }
                break;
            case 'bed':
                $query->with(['ward', 'ward.department']);
                if (isset($filters['ward_id'])) {
                    $query->where('ward_id', $filters['ward_id']);
                }
                break;
            case 'test_catalog':
                $query->with('department');
                if (isset($filters['department_id'])) {
                    $query->where('department_id', $filters['department_id']);
                }
                if (isset($filters['category'])) {
                    $query->where('category', $filters['category']);
                }
                break;
        }

        return $query->get();
    }

    /**
     * Get master data statistics for dashboard
     *
     * @return array
     */
    public function getMasterDataStats(): array
    {
        return $this->cacheService->getMasterDataStats();
    }

    /**
     * Get recent activity for audit trail display
     *
     * @param int $limit
     * @return Collection
     */
    public function getRecentActivity(int $limit = 20): Collection
    {
        return MasterDataAudit::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($audit) {
                return [
                    'id' => $audit->id,
                    'entity_type' => $audit->entity_type,
                    'entity_id' => $audit->entity_id,
                    'action' => $audit->action,
                    'user_name' => $audit->user->name ?? 'System',
                    'created_at' => $audit->created_at,
                    'summary' => $this->generateActivitySummary($audit),
                ];
            });
    }

    /**
     * Generate human-readable activity summary
     *
     * @param MasterDataAudit $audit
     * @return string
     */
    protected function generateActivitySummary(MasterDataAudit $audit): string
    {
        $entityName = str_replace('_', ' ', $audit->entity_type);
        
        switch ($audit->action) {
            case 'created':
                return "Created new {$entityName}";
            case 'updated':
                $changes = array_keys($audit->new_values ?? []);
                $changesList = implode(', ', $changes);
                return "Updated {$entityName} ({$changesList})";
            case 'deleted':
                return "Deleted {$entityName}";
            case 'status_changed':
                $oldStatus = $audit->old_values['status'] ?? 'unknown';
                $newStatus = $audit->new_values['status'] ?? 'unknown';
                return "Changed {$entityName} status from {$oldStatus} to {$newStatus}";
            default:
                return "Modified {$entityName}";
        }
    }

    /**
     * Bulk update entities with validation and audit logging
     *
     * @param string $entityType
     * @param array $updates Array of ['id' => id, 'data' => data] items
     * @return array Results with success/error status
     */
    public function bulkUpdateEntities(string $entityType, array $updates): array
    {
        $results = [];
        
        DB::beginTransaction();
        
        try {
            foreach ($updates as $update) {
                $entityId = $update['id'];
                $data = $update['data'];
                
                $modelClass = $this->entityMappings[$entityType];
                $entity = $modelClass::find($entityId);
                
                if (!$entity) {
                    $results[] = [
                        'id' => $entityId,
                        'success' => false,
                        'error' => 'Entity not found',
                    ];
                    continue;
                }
                
                $oldValues = $entity->toArray();
                $entity->update($data);
                
                $this->logMasterDataChange(
                    $entityType,
                    $entityId,
                    'updated',
                    $oldValues,
                    $entity->fresh()->toArray()
                );
                
                $results[] = [
                    'id' => $entityId,
                    'success' => true,
                ];
            }
            
            DB::commit();
            
            // Invalidate caches after successful bulk update
            $this->invalidateRelatedCaches($entityType, 0);
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
        
        return $results;
    }

    /**
     * Invalidate entity type cache
     *
     * @param string $entityType
     * @return void
     */
    public function invalidateEntityTypeCache(string $entityType): void
    {
        $cacheKeys = [
            "master_data.{$entityType}.all",
            "master_data.{$entityType}.active",
            "master_data.stats",
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Get model class by entity type string
     *
     * @param string $type
     * @return string|null
     */
    protected function getModelClassByType(string $type): ?string
    {
        $models = [
            'departments' => Department::class,
            'wards' => Ward::class,
            'beds' => Bed::class,
            'test-catalogs' => TestCatalog::class,
            'drug-formulary' => DrugFormulary::class,
        ];

        return $models[$type] ?? null;
    }
}