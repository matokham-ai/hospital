<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;

class QueryOptimizationService
{
    /**
     * Get departments with optimized relationships
     */
    public function getDepartmentsWithRelations(array $relations = []): Collection
    {
        $query = Department::query();
        
        // Default optimized relationships
        $defaultRelations = ['wards', 'testCatalogs'];
        $relations = array_merge($defaultRelations, $relations);
        
        return $query->with($relations)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get();
    }
    
    /**
     * Get wards with beds and department information
     */
    public function getWardsWithBedsOptimized(): Collection
    {
        return Ward::with([
            'department:deptid,name,code',
            'beds' => function ($query) {
                $query->select('id', 'ward_id', 'bed_number', 'bed_type', 'status', 'last_occupied_at')
                      ->orderBy('bed_number');
            }
        ])
        ->select('wardid', 'name', 'ward_type', 'total_beds', 'department_id', 'status', 'floor_number')
        ->orderBy('name')
        ->get();
    }
    
    /**
     * Get bed occupancy matrix with minimal data
     */
    public function getBedOccupancyMatrix(): array
    {
        $result = DB::select("
            SELECT 
                w.wardid,
                w.name as ward_name,
                w.ward_type,
                w.total_beds,
                w.status as ward_status,
                d.name as department_name,
                COUNT(b.id) as total_beds_count,
                SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count,
                SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_count,
                SUM(CASE WHEN b.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count
            FROM wards w
            LEFT JOIN departments d ON w.department_id = d.deptid
            LEFT JOIN beds b ON w.wardid = b.ward_id
            WHERE w.status = 'active'
            GROUP BY w.wardid, w.name, w.ward_type, w.total_beds, w.status, d.name
            ORDER BY d.name, w.name
        ");
        
        return array_map(function ($row) {
            return (array) $row;
        }, $result);
    }
    
    /**
     * Get test catalogs with department and category information
     */
    public function getTestCatalogsOptimized(array $filters = []): Collection
    {
        $query = TestCatalog::with([
            'department:deptid,name,code',
            'category:id,name'
        ])
        ->select('id', 'deptid', 'category_id', 'name', 'code', 'price', 'turnaround_time', 'unit', 'status');
        
        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['department_id'])) {
            $query->where('deptid', $filters['department_id']);
        }
        
        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        
        return $query->orderBy('category_id')
                    ->orderBy('name')
                    ->get();
    }
    
    /**
     * Get drug formulary with substitute information
     */
    public function getDrugFormularyOptimized(array $filters = []): Collection
    {
        $query = DrugFormulary::with([
            'substitutes:id,name,generic_name,atc_code,status'
        ])
        ->select('id', 'name', 'generic_name', 'atc_code', 'strength', 'form', 'stock_quantity', 'reorder_level', 'unit_price', 'status');
        
        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['low_stock']) && $filters['low_stock']) {
            $query->whereRaw('stock_quantity <= reorder_level');
        }
        
        if (isset($filters['atc_code'])) {
            $query->where('atc_code', 'like', $filters['atc_code'] . '%');
        }
        
        return $query->orderBy('name')->get();
    }
    
    /**
     * Get dashboard statistics with single query
     */
    public function getDashboardStatsOptimized(): array
    {
        $stats = DB::select("
            SELECT 
                'departments' as type,
                COUNT(*) as count
            FROM departments 
            WHERE status = 'active'
            
            UNION ALL
            
            SELECT 
                'wards' as type,
                COUNT(*) as count
            FROM wards 
            WHERE status = 'active'
            
            UNION ALL
            
            SELECT 
                'beds' as type,
                COUNT(*) as count
            FROM beds 
            WHERE status IN ('available', 'occupied')
            
            UNION ALL
            
            SELECT 
                'occupied_beds' as type,
                COUNT(*) as count
            FROM beds 
            WHERE status = 'occupied'
            
            UNION ALL
            
            SELECT 
                'available_beds' as type,
                COUNT(*) as count
            FROM beds 
            WHERE status = 'available'
            
            UNION ALL
            
            SELECT 
                'tests' as type,
                COUNT(*) as count
            FROM test_catalogs 
            WHERE status = 'active'
            
            UNION ALL
            
            SELECT 
                'drugs' as type,
                COUNT(*) as count
            FROM drug_formulary 
            WHERE status = 'active'
        ");
        
        $result = [];
        foreach ($stats as $stat) {
            $result[$stat->type] = (int) $stat->count;
        }
        
        return $result;
    }
    
    /**
     * Search across all master data entities efficiently
     */
    public function globalSearch(string $query, int $limit = 50): array
    {
        $searchTerm = '%' . $query . '%';
        
        $results = [
            'departments' => [],
            'wards' => [],
            'tests' => [],
            'drugs' => []
        ];
        
        // Search departments
        $results['departments'] = Department::select('deptid as id', 'name', 'code', 'status')
            ->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm);
            })
            ->where('status', 'active')
            ->limit($limit / 4)
            ->get()
            ->toArray();
        
        // Search wards
        $results['wards'] = Ward::select('wardid as id', 'name', 'ward_type', 'status')
            ->where('name', 'like', $searchTerm)
            ->where('status', 'active')
            ->limit($limit / 4)
            ->get()
            ->toArray();
        
        // Search test catalogs
        $results['tests'] = TestCatalog::select('id', 'name', 'code', 'category_id', 'status')
            ->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm);
            })
            ->where('status', 'active')
            ->limit($limit / 4)
            ->get()
            ->toArray();
        
        // Search drug formulary
        $results['drugs'] = DrugFormulary::select('id', 'name', 'generic_name', 'atc_code', 'status')
            ->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('generic_name', 'like', $searchTerm)
                  ->orWhere('atc_code', 'like', $searchTerm);
            })
            ->where('status', 'active')
            ->limit($limit / 4)
            ->get()
            ->toArray();
        
        return $results;
    }
    
    /**
     * Get recent activity with optimized joins
     */
    public function getRecentActivityOptimized(int $limit = 20): SupportCollection
    {
        return DB::table('master_data_audits as mda')
            ->leftJoin('users as u', 'mda.user_id', '=', 'u.id')
            ->select([
                'mda.id',
                'mda.entity_type',
                'mda.entity_id',
                'mda.action',
                'mda.created_at',
                'u.name as user_name'
            ])
            ->orderBy('mda.created_at', 'desc')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Bulk operations with optimized queries
     */
    public function bulkUpdateWithOptimization(string $entityType, array $updates): array
    {
        $results = [];
        $entityIds = array_column($updates, 'id');
        
        // Get all entities in one query
        $modelClass = $this->getModelClass($entityType);
        $entities = $modelClass::whereIn('id', $entityIds)->get()->keyBy('id');
        
        DB::beginTransaction();
        
        try {
            foreach ($updates as $update) {
                $entityId = $update['id'];
                $data = $update['data'];
                
                if (!isset($entities[$entityId])) {
                    $results[] = [
                        'id' => $entityId,
                        'success' => false,
                        'error' => 'Entity not found'
                    ];
                    continue;
                }
                
                $entity = $entities[$entityId];
                $entity->update($data);
                
                $results[] = [
                    'id' => $entityId,
                    'success' => true
                ];
            }
            
            DB::commit();
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
        
        return $results;
    }
    
    /**
     * Get model class by entity type
     */
    private function getModelClass(string $entityType): string
    {
        $models = [
            'department' => Department::class,
            'ward' => Ward::class,
            'bed' => Bed::class,
            'test_catalog' => TestCatalog::class,
            'drug_formulary' => DrugFormulary::class,
        ];
        
        if (!isset($models[$entityType])) {
            throw new \InvalidArgumentException("Unknown entity type: {$entityType}");
        }
        
        return $models[$entityType];
    }
}