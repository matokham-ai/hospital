<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Services\MasterDataService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MasterDataController extends Controller
{
    protected MasterDataService $masterDataService;

    public function __construct(MasterDataService $masterDataService)
    {
        $this->masterDataService = $masterDataService;
    }

    /**
     * Get all records for a specific master data entity type
     */
    public function index(string $type): JsonResponse
    {
        $model = $this->getModelClass($type);
        
        if (!$model) {
            return response()->json(['error' => 'Invalid entity type'], 400);
        }

        $query = $model::query();
        
        // Apply entity-specific includes and filters
        switch ($type) {
            case 'departments':
                $query->withCount(['wards', 'testCatalogs']);
                break;
            case 'wards':
                $query->with('department:id,name')->withCount('beds');
                break;
            case 'beds':
                $query->with(['ward:id,name', 'ward.department:id,name']);
                break;
            case 'test-catalogs':
                $query->with('department:id,name');
                break;
            case 'drug-formulary':
                $query->with('substitutes');
                break;
        }

        // Apply search if provided
        if (request()->has('search')) {
            $search = request()->get('search');
            $query->where(function ($q) use ($search, $type) {
                switch ($type) {
                    case 'departments':
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                        break;
                    case 'wards':
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('type', 'like', "%{$search}%");
                        break;
                    case 'beds':
                        $q->where('bed_number', 'like', "%{$search}%")
                          ->orWhere('bed_type', 'like', "%{$search}%");
                        break;
                    case 'test-catalogs':
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                        break;
                    case 'drug-formulary':
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('generic_name', 'like', "%{$search}%")
                          ->orWhere('atc_code', 'like', "%{$search}%");
                        break;
                }
            });
        }

        // Apply status filter if provided
        if (request()->has('status')) {
            $query->where('status', request()->get('status'));
        }

        // Apply pagination
        $perPage = request()->get('per_page', 15);
        $data = $query->paginate($perPage);

        return response()->json($data);
    }

    /**
     * Store a new master data record
     */
    public function store(string $type, Request $request): JsonResponse
    {
        $model = $this->getModelClass($type);
        
        if (!$model) {
            return response()->json(['error' => 'Invalid entity type'], 400);
        }

        $validationRules = $this->getValidationRules($type, 'create');
        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $record = $model::create($request->validated());
            
            // Log the creation
            $this->masterDataService->logMasterDataChange(
                class_basename($model),
                $record->id,
                $record->toArray(),
                'created'
            );

            // Invalidate related caches
            $this->masterDataService->invalidateRelatedCaches(class_basename($model), $record->id);

            return response()->json($record->load($this->getDefaultRelations($type)), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create record: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a master data record
     */
    public function update(string $type, int $id, Request $request): JsonResponse
    {
        $model = $this->getModelClass($type);
        
        if (!$model) {
            return response()->json(['error' => 'Invalid entity type'], 400);
        }

        $record = $model::find($id);
        
        if (!$record) {
            return response()->json(['error' => 'Record not found'], 404);
        }

        $validationRules = $this->getValidationRules($type, 'update', $id);
        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $oldData = $record->toArray();
            $record->update($request->validated());
            
            // Log the update
            $this->masterDataService->logMasterDataChange(
                class_basename($model),
                $record->id,
                $request->validated(),
                'updated',
                $oldData
            );

            // Invalidate related caches
            $this->masterDataService->invalidateRelatedCaches(class_basename($model), $record->id);

            return response()->json($record->load($this->getDefaultRelations($type)));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update record: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a master data record
     */
    public function destroy(string $type, int $id): JsonResponse
    {
        $model = $this->getModelClass($type);
        
        if (!$model) {
            return response()->json(['error' => 'Invalid entity type'], 400);
        }

        $record = $model::find($id);
        
        if (!$record) {
            return response()->json(['error' => 'Record not found'], 404);
        }

        try {
            // Check for references before deletion
            $references = $this->masterDataService->validateEntityReferences(class_basename($model), $id);
            
            if (!empty($references)) {
                return response()->json([
                    'error' => 'Cannot delete record with active references',
                    'references' => $references
                ], 409);
            }

            $oldData = $record->toArray();
            $record->delete();
            
            // Log the deletion
            $this->masterDataService->logMasterDataChange(
                class_basename($model),
                $id,
                [],
                'deleted',
                $oldData
            );

            // Invalidate related caches
            $this->masterDataService->invalidateRelatedCaches(class_basename($model), $id);

            return response()->json(['message' => 'Record deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete record: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update multiple records
     */
    public function bulkUpdate(string $type, Request $request): JsonResponse
    {
        $model = $this->getModelClass($type);
        
        if (!$model) {
            return response()->json(['error' => 'Invalid entity type'], 400);
        }

        $validator = Validator::make($request->all(), [
            'updates' => 'required|array',
            'updates.*.id' => 'required|integer',
            'updates.*.data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $results = [];
            $errors = [];

            foreach ($request->input('updates') as $update) {
                $record = $model::find($update['id']);
                
                if (!$record) {
                    $errors[] = "Record with ID {$update['id']} not found";
                    continue;
                }

                $validationRules = $this->getValidationRules($type, 'update', $update['id']);
                $validator = Validator::make($update['data'], $validationRules);

                if ($validator->fails()) {
                    $errors[] = "Validation failed for ID {$update['id']}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $oldData = $record->toArray();
                $record->update($update['data']);
                
                // Log the update
                $this->masterDataService->logMasterDataChange(
                    class_basename($model),
                    $record->id,
                    $update['data'],
                    'bulk_updated',
                    $oldData
                );

                $results[] = $record;
            }

            // Invalidate caches for the entity type
            $this->masterDataService->invalidateEntityTypeCache(class_basename($model));

            return response()->json([
                'updated' => count($results),
                'errors' => $errors,
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Bulk update failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export master data to CSV/Excel
     */
    public function export(string $type, Request $request): BinaryFileResponse|JsonResponse
    {
        $exportClass = $this->getExportClass($type);
        
        if (!$exportClass) {
            return response()->json(['error' => 'Invalid entity type'], 400);
        }

        try {
            // Get filters from request
            $filters = $request->only(['status', 'search', 'category', 'department_id', 'form', 'low_stock', 'type', 'bed_type', 'ward_id']);
            
            // Determine file format
            $format = $request->get('format', 'xlsx');
            $extension = in_array($format, ['xlsx', 'csv']) ? $format : 'xlsx';
            
            $filename = "{$type}_export_" . now()->format('Y-m-d_H-i-s') . ".{$extension}";
            
            // Create export instance with filters
            $export = new $exportClass($filters);
            
            // Log the export operation
            $this->masterDataService->logMasterDataChange(
                class_basename($this->getModelClass($type)),
                0,
                'exported',
                [],
                [
                    'export_type' => $type,
                    'format' => $extension,
                    'filters' => $filters,
                    'filename' => $filename
                ]
            );

            return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the model class for the given entity type
     */
    private function getModelClass(string $type): ?string
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

    /**
     * Get validation rules for the entity type and operation
     */
    private function getValidationRules(string $type, string $operation, ?int $id = null): array
    {
        $rules = [];

        switch ($type) {
            case 'departments':
                $rules = [
                    'name' => 'required|string|max:255',
                    'code' => 'required|string|max:10|unique:departments,code' . ($id ? ",{$id}" : ''),
                    'icon' => 'nullable|string|max:50',
                    'description' => 'nullable|string',
                    'status' => 'required|in:active,inactive',
                    'sort_order' => 'nullable|integer|min:0',
                ];
                break;

            case 'wards':
                $rules = [
                    'department_id' => 'required|exists:departments,id',
                    'name' => 'required|string|max:255',
                    'type' => 'required|in:general,icu,maternity,pediatric,emergency,surgical',
                    'capacity' => 'required|integer|min:1',
                    'floor_number' => 'nullable|integer|min:0',
                    'description' => 'nullable|string',
                    'status' => 'required|in:active,inactive,maintenance,renovation',
                ];
                break;

            case 'beds':
                $rules = [
                    'ward_id' => 'required|exists:wards,id',
                    'bed_number' => 'required|string|max:20',
                    'bed_type' => 'required|in:standard,icu,isolation,maternity,pediatric',
                    'status' => 'required|in:available,occupied,maintenance,reserved,out_of_order',
                    'maintenance_notes' => 'nullable|string',
                ];
                break;

            case 'test-catalogs':
                $rules = [
                    'department_id' => 'required|exists:departments,id',
                    'name' => 'required|string|max:255',
                    'code' => 'required|string|max:20|unique:test_catalogs,code' . ($id ? ",{$id}" : ''),
                    'category' => 'required|string|max:100',
                    'price' => 'required|numeric|min:0',
                    'turnaround_time' => 'required|integer|min:1',
                    'unit' => 'nullable|string|max:50',
                    'normal_range' => 'nullable|string',
                    'sample_type' => 'nullable|string|max:100',
                    'status' => 'required|in:active,inactive',
                ];
                break;

            case 'drug-formulary':
                $rules = [
                    'name' => 'required|string|max:255',
                    'generic_name' => 'required|string|max:255',
                    'atc_code' => 'nullable|string|max:20|regex:/^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$/',
                    'strength' => 'required|string|max:100',
                    'form' => 'required|in:tablet,capsule,syrup,injection,cream,ointment,drops,inhaler',
                    'stock_quantity' => 'required|integer|min:0',
                    'reorder_level' => 'required|integer|min:0',
                    'unit_price' => 'required|numeric|min:0',
                    'manufacturer' => 'nullable|string|max:255',
                    'status' => 'required|in:active,discontinued',
                ];
                break;
        }

        return $rules;
    }

    /**
     * Get default relations to load for the entity type
     */
    private function getDefaultRelations(string $type): array
    {
        $relations = [
            'departments' => [],
            'wards' => ['department:id,name'],
            'beds' => ['ward:id,name', 'ward.department:id,name'],
            'test-catalogs' => ['department:id,name'],
            'drug-formulary' => ['substitutes'],
        ];

        return $relations[$type] ?? [];
    }

    /**
     * Get the export class for the given entity type
     */
    private function getExportClass(string $type): ?string
    {
        $exports = [
            'departments' => \App\Exports\DepartmentExport::class,
            'wards' => \App\Exports\WardExport::class,
            'beds' => \App\Exports\BedExport::class,
            'test-catalogs' => \App\Exports\TestCatalogExport::class,
            'drug-formulary' => \App\Exports\DrugFormularyExport::class,
        ];

        return $exports[$type] ?? null;
    }
}