<?php

namespace App\Services;

use App\Models\DrugFormulary;
use App\Services\MasterDataService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DrugFormularyService
{
    protected MasterDataService $masterDataService;
    protected MasterDataCacheService $cacheService;

    public function __construct(MasterDataService $masterDataService, MasterDataCacheService $cacheService)
    {
        $this->masterDataService = $masterDataService;
        $this->cacheService = $cacheService;
    }

    /**
     * Get all drugs with optional filtering
     *
     * @param array $filters
     * @return Collection
     */
    public function getAllDrugs(array $filters = []): Collection
    {
        $cacheKey = 'master_data.drugs.all';
        
        if (!empty($filters)) {
            $cacheKey .= '.' . md5(serialize($filters));
        }

        return Cache::remember($cacheKey, 1800, function () use ($filters) {
            $query = DrugFormulary::query();

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('generic_name', 'like', "%{$search}%")
                      ->orWhere('atc_code', 'like', "%{$search}%")
                      ->orWhere('manufacturer', 'like', "%{$search}%");
                });
            }

            if (isset($filters['form'])) {
                $query->where('form', $filters['form']);
            }

            if (isset($filters['stock_status'])) {
                switch ($filters['stock_status']) {
                    case 'in_stock':
                        $query->whereRaw('stock_quantity > reorder_level');
                        break;
                    case 'low_stock':
                        $query->whereRaw('stock_quantity <= reorder_level AND stock_quantity > 0');
                        break;
                    case 'out_of_stock':
                        $query->where('stock_quantity', 0);
                        break;
                }
            }

            if (isset($filters['atc_class'])) {
                $query->where('atc_code', 'like', $filters['atc_class'] . '%');
            }

            return $query->orderBy('name')
                        ->get()
                        ->map(function ($drug) {
                            return $this->enrichDrugWithStockInfo($drug);
                        });
        });
    }

    /**
     * Get active drugs for dropdowns and references
     *
     * @return Collection
     */
    public function getActiveDrugs(): Collection
    {
        return Cache::remember('master_data.drugs.active', 3600, function () {
            return DrugFormulary::where('status', 'active')
                              ->orderBy('name')
                              ->get(['id', 'name', 'generic_name', 'strength', 'form', 'unit_price'])
                              ->map(function ($drug) {
                                  return $this->enrichDrugWithStockInfo($drug);
                              });
        });
    }

    /**
     * Get drugs with low stock
     *
     * @return Collection
     */
    public function getLowStockDrugs(): Collection
    {
        return Cache::remember('master_data.drugs.low_stock', 900, function () {
            return DrugFormulary::where('status', 'active')
                              ->whereRaw('stock_quantity <= reorder_level')
                              ->where('stock_quantity', '>', 0)
                              ->orderBy('stock_quantity')
                              ->get()
                              ->map(function ($drug) {
                                  return $this->enrichDrugWithStockInfo($drug);
                              });
        });
    }

    /**
     * Get out of stock drugs
     *
     * @return Collection
     */
    public function getOutOfStockDrugs(): Collection
    {
        return DrugFormulary::where('status', 'active')
                          ->where('stock_quantity', 0)
                          ->orderBy('name')
                          ->get()
                          ->map(function ($drug) {
                              return $this->enrichDrugWithStockInfo($drug);
                          });
    }

    /**
     * Create a new drug formulary entry
     *
     * @param array $data
     * @return DrugFormulary
     * @throws ValidationException
     */
    public function createDrug(array $data): DrugFormulary
    {
        // Validate ATC code format
        $this->validateATCCode($data['atc_code']);

        // Validate pricing and stock data
        $this->validatePricingAndStock($data);

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        // Set default reorder level if not provided
        if (!isset($data['reorder_level'])) {
            $data['reorder_level'] = 10; // Default minimum stock level
        }

        DB::beginTransaction();

        try {
            $drug = DrugFormulary::create($data);

            $this->masterDataService->logMasterDataChange(
                'drug_formulary',
                $drug->id,
                'created',
                [],
                $drug->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('drug_formulary', $drug->id);

            DB::commit();

            return $drug;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing drug formulary entry
     *
     * @param DrugFormulary $drug
     * @param array $data
     * @return DrugFormulary
     * @throws ValidationException
     */
    public function updateDrug(DrugFormulary $drug, array $data): DrugFormulary
    {
        // Validate ATC code if being changed
        if (isset($data['atc_code']) && $data['atc_code'] !== $drug->atc_code) {
            $this->validateATCCode($data['atc_code']);
        }

        // Validate pricing and stock data if being changed
        if (array_intersect_key($data, array_flip(['unit_price', 'stock_quantity', 'reorder_level']))) {
            $this->validatePricingAndStock(array_merge($drug->toArray(), $data));
        }

        $oldValues = $drug->toArray();

        DB::beginTransaction();

        try {
            $drug->update($data);

            $this->masterDataService->logMasterDataChange(
                'drug_formulary',
                $drug->id,
                'updated',
                $oldValues,
                $drug->fresh()->toArray()
            );

            $this->masterDataService->invalidateRelatedCaches('drug_formulary', $drug->id);

            DB::commit();

            return $drug->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update drug stock quantity
     *
     * @param DrugFormulary $drug
     * @param int $newQuantity
     * @param string $reason
     * @return DrugFormulary
     */
    public function updateStockQuantity(DrugFormulary $drug, int $newQuantity, string $reason = 'manual_adjustment'): DrugFormulary
    {
        if ($newQuantity < 0) {
            throw ValidationException::withMessages([
                'stock_quantity' => 'Stock quantity cannot be negative'
            ]);
        }

        $oldValues = $drug->toArray();

        DB::beginTransaction();

        try {
            $drug->update(['stock_quantity' => $newQuantity]);

            $this->masterDataService->logMasterDataChange(
                'drug_formulary',
                $drug->id,
                'stock_updated',
                $oldValues,
                array_merge($drug->fresh()->toArray(), ['reason' => $reason])
            );

            $this->masterDataService->invalidateRelatedCaches('drug_formulary', $drug->id);

            DB::commit();

            return $drug->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Adjust stock (add or subtract)
     *
     * @param DrugFormulary $drug
     * @param int $adjustment
     * @param string $reason
     * @return DrugFormulary
     */
    public function adjustStock(DrugFormulary $drug, int $adjustment, string $reason = 'adjustment'): DrugFormulary
    {
        $newQuantity = $drug->stock_quantity + $adjustment;

        if ($newQuantity < 0) {
            throw ValidationException::withMessages([
                'adjustment' => 'Adjustment would result in negative stock quantity'
            ]);
        }

        return $this->updateStockQuantity($drug, $newQuantity, $reason);
    }

    /**
     * Search drugs with advanced filtering
     *
     * @param string $query
     * @param array $filters
     * @return Collection
     */
    public function searchDrugs(string $query, array $filters = []): Collection
    {
        $searchQuery = DrugFormulary::query();

        // Text search
        if (!empty($query)) {
            $searchQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('generic_name', 'like', "%{$query}%")
                  ->orWhere('atc_code', 'like', "%{$query}%")
                  ->orWhere('manufacturer', 'like', "%{$query}%");
            });
        }

        // Apply filters
        if (isset($filters['form'])) {
            if (is_array($filters['form'])) {
                $searchQuery->whereIn('form', $filters['form']);
            } else {
                $searchQuery->where('form', $filters['form']);
            }
        }

        if (isset($filters['status'])) {
            $searchQuery->where('status', $filters['status']);
        }

        if (isset($filters['atc_class'])) {
            $searchQuery->where('atc_code', 'like', $filters['atc_class'] . '%');
        }

        if (isset($filters['manufacturer'])) {
            $searchQuery->where('manufacturer', 'like', "%{$filters['manufacturer']}%");
        }

        if (isset($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'in_stock':
                    $searchQuery->whereRaw('stock_quantity > reorder_level');
                    break;
                case 'low_stock':
                    $searchQuery->whereRaw('stock_quantity <= reorder_level AND stock_quantity > 0');
                    break;
                case 'out_of_stock':
                    $searchQuery->where('stock_quantity', 0);
                    break;
            }
        }

        if (isset($filters['price_range'])) {
            $range = $filters['price_range'];
            if (isset($range['min'])) {
                $searchQuery->where('unit_price', '>=', $range['min']);
            }
            if (isset($range['max'])) {
                $searchQuery->where('unit_price', '<=', $range['max']);
            }
        }

        return $searchQuery->orderBy('name')
                          ->get()
                          ->map(function ($drug) {
                              return $this->enrichDrugWithStockInfo($drug);
                          });
    }

    /**
     * Get substitute drugs for a given drug
     *
     * @param DrugFormulary $drug
     * @return Collection
     */
    public function getSubstituteDrugs(DrugFormulary $drug): Collection
    {
        // Find drugs with same ATC code (same therapeutic class)
        $atcClass = substr($drug->atc_code, 0, 5); // First 5 characters for therapeutic subgroup
        
        return DrugFormulary::where('atc_code', 'like', $atcClass . '%')
                          ->where('id', '!=', $drug->id)
                          ->where('status', 'active')
                          ->where('form', $drug->form) // Same dosage form
                          ->orderBy('generic_name')
                          ->get()
                          ->map(function ($substitute) {
                              return $this->enrichDrugWithStockInfo($substitute);
                          });
    }

    /**
     * Get drug statistics
     *
     * @return array
     */
    public function getDrugStats(): array
    {
        return Cache::remember('master_data.drugs.stats', 1800, function () {
            $totalDrugs = DrugFormulary::count();
            $activeDrugs = DrugFormulary::where('status', 'active')->count();
            
            return [
                'total_drugs' => $totalDrugs,
                'active_drugs' => $activeDrugs,
                'discontinued_drugs' => $totalDrugs - $activeDrugs,
                'in_stock' => DrugFormulary::where('status', 'active')
                                        ->whereRaw('stock_quantity > reorder_level')
                                        ->count(),
                'low_stock' => DrugFormulary::where('status', 'active')
                                         ->whereRaw('stock_quantity <= reorder_level AND stock_quantity > 0')
                                         ->count(),
                'out_of_stock' => DrugFormulary::where('status', 'active')
                                             ->where('stock_quantity', 0)
                                             ->count(),
                'total_stock_value' => DrugFormulary::where('status', 'active')
                                                  ->selectRaw('SUM(stock_quantity * unit_price) as total')
                                                  ->value('total') ?? 0,
                'avg_unit_price' => round(DrugFormulary::where('status', 'active')->avg('unit_price'), 2),
                'by_form' => DrugFormulary::where('status', 'active')
                                        ->groupBy('form')
                                        ->selectRaw('form, count(*) as count')
                                        ->pluck('count', 'form')
                                        ->toArray(),
            ];
        });
    }

    /**
     * Toggle drug status
     *
     * @param DrugFormulary $drug
     * @return DrugFormulary
     */
    public function toggleDrugStatus(DrugFormulary $drug): DrugFormulary
    {
        $newStatus = $drug->status === 'active' ? 'discontinued' : 'active';
        
        return $this->updateDrug($drug, ['status' => $newStatus]);
    }

    /**
     * Bulk update stock quantities
     *
     * @param array $stockUpdates Array of ['drug_id' => id, 'quantity' => new_quantity, 'reason' => reason]
     * @return array
     */
    public function bulkUpdateStock(array $stockUpdates): array
    {
        $results = [];

        DB::beginTransaction();

        try {
            foreach ($stockUpdates as $update) {
                $drug = DrugFormulary::find($update['drug_id']);
                
                if (!$drug) {
                    $results[] = [
                        'drug_id' => $update['drug_id'],
                        'success' => false,
                        'error' => 'Drug not found'
                    ];
                    continue;
                }

                // Validate quantity
                if ($update['quantity'] < 0) {
                    $results[] = [
                        'drug_id' => $update['drug_id'],
                        'success' => false,
                        'error' => 'Stock quantity cannot be negative'
                    ];
                    continue;
                }

                $oldValues = $drug->toArray();
                $drug->update(['stock_quantity' => $update['quantity']]);

                $this->masterDataService->logMasterDataChange(
                    'drug_formulary',
                    $drug->id,
                    'stock_updated',
                    $oldValues,
                    array_merge($drug->fresh()->toArray(), ['reason' => $update['reason'] ?? 'bulk_update'])
                );

                $results[] = [
                    'drug_id' => $update['drug_id'],
                    'success' => true
                ];
            }

            $this->masterDataService->invalidateRelatedCaches('drug_formulary', 0);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    /**
     * Get drugs requiring reorder
     *
     * @return Collection
     */
    public function getDrugsRequiringReorder(): Collection
    {
        return DrugFormulary::where('status', 'active')
                          ->whereRaw('stock_quantity <= reorder_level')
                          ->orderBy('stock_quantity')
                          ->orderBy('name')
                          ->get()
                          ->map(function ($drug) {
                              return $this->enrichDrugWithStockInfo($drug);
                          });
    }

    /**
     * Enrich drug data with stock status information
     *
     * @param DrugFormulary $drug
     * @return DrugFormulary
     */
    protected function enrichDrugWithStockInfo(DrugFormulary $drug): DrugFormulary
    {
        if ($drug->stock_quantity > $drug->reorder_level) {
            $drug->stock_status = 'in_stock';
            $drug->stock_badge_color = 'green';
        } elseif ($drug->stock_quantity > 0) {
            $drug->stock_status = 'low_stock';
            $drug->stock_badge_color = 'yellow';
        } else {
            $drug->stock_status = 'out_of_stock';
            $drug->stock_badge_color = 'red';
        }

        $drug->stock_value = $drug->stock_quantity * $drug->unit_price;
        $drug->needs_reorder = $drug->stock_quantity <= $drug->reorder_level;

        return $drug;
    }

    /**
     * Validate ATC code format
     *
     * @param string $atcCode
     * @throws ValidationException
     */
    protected function validateATCCode(string $atcCode): void
    {
        // ATC codes should be 7 characters: 1 letter + 2 digits + 1 letter + 2 digits + 1 digit
        if (!preg_match('/^[A-Z][0-9]{2}[A-Z][0-9]{2}[0-9]$/', $atcCode)) {
            throw ValidationException::withMessages([
                'atc_code' => 'ATC code must follow the format: A10BA02 (1 letter, 2 digits, 1 letter, 2 digits, 1 digit)'
            ]);
        }
    }

    /**
     * Validate pricing and stock data
     *
     * @param array $data
     * @throws ValidationException
     */
    protected function validatePricingAndStock(array $data): void
    {
        if (isset($data['unit_price']) && $data['unit_price'] <= 0) {
            throw ValidationException::withMessages([
                'unit_price' => 'Unit price must be greater than 0'
            ]);
        }

        if (isset($data['stock_quantity']) && $data['stock_quantity'] < 0) {
            throw ValidationException::withMessages([
                'stock_quantity' => 'Stock quantity cannot be negative'
            ]);
        }

        if (isset($data['reorder_level']) && $data['reorder_level'] < 0) {
            throw ValidationException::withMessages([
                'reorder_level' => 'Reorder level cannot be negative'
            ]);
        }

        // Validate reasonable ranges
        if (isset($data['unit_price']) && $data['unit_price'] > 100000) {
            throw ValidationException::withMessages([
                'unit_price' => 'Unit price seems unusually high. Please verify.'
            ]);
        }

        if (isset($data['stock_quantity']) && $data['stock_quantity'] > 1000000) {
            throw ValidationException::withMessages([
                'stock_quantity' => 'Stock quantity seems unusually high. Please verify.'
            ]);
        }
    }

    /**
     * Get stock status for a drug
     *
     * @param DrugFormulary $drug
     * @return string
     */
    public function getStockStatus(DrugFormulary $drug): string
    {
        if ($drug->stock_quantity > $drug->reorder_level) {
            return 'in_stock';
        } elseif ($drug->stock_quantity > 0) {
            return 'low_stock';
        } else {
            return 'out_of_stock';
        }
    }

    /**
     * Check if drug has active references (prescriptions, orders, etc.)
     *
     * @param DrugFormulary $drug
     * @return bool
     */
    public function hasActiveReferences(DrugFormulary $drug): bool
    {
        // This would check for active prescriptions, orders, etc. when those systems are implemented
        // For now, return false as no prescription system exists yet
        
        // Example implementation when prescription system exists:
        // return $drug->prescriptions()->whereIn('status', ['active', 'pending'])->exists();
        
        return false;
    }

    /**
     * Log stock adjustment
     *
     * @param DrugFormulary $drug
     * @param int $oldQuantity
     * @param int $newQuantity
     * @param string $reason
     * @return void
     */
    public function logStockAdjustment(DrugFormulary $drug, int $oldQuantity, int $newQuantity, string $reason): void
    {
        $this->masterDataService->logMasterDataChange(
            'DrugFormulary',
            $drug->id,
            [
                'stock_quantity' => $newQuantity,
                'adjustment_amount' => $newQuantity - $oldQuantity,
                'reason' => $reason,
            ],
            'stock_adjusted',
            ['stock_quantity' => $oldQuantity]
        );
    }

    /**
     * Get available substitutes for a drug
     *
     * @param DrugFormulary $drug
     * @return Collection
     */
    public function getAvailableSubstitutes(DrugFormulary $drug): Collection
    {
        return $drug->substitutes()->where('status', 'active')->get();
    }



    /**
     * Import drugs from CSV/Excel file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    public function importFromCsv($file): array
    {
        try {
            $import = new \App\Imports\DrugFormularyImport();
            
            DB::beginTransaction();
            
            \Maatwebsite\Excel\Facades\Excel::import($import, $file);
            
            // Log the import operation
            $this->masterDataService->logMasterDataChange(
                'drug_formulary',
                0,
                'bulk_imported',
                [],
                [
                    'imported_count' => $import->getImportedCount(),
                    'skipped_count' => $import->getSkippedCount(),
                    'file_name' => $file->getClientOriginalName()
                ]
            );

            // Invalidate drug formulary caches
            $this->masterDataService->invalidateRelatedCaches('drug_formulary', 0);
            
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