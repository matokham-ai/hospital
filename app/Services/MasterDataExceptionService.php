<?php

namespace App\Services;

use App\Exceptions\DepartmentInUseException;
use App\Exceptions\BedOccupancyConflictException;
use App\Exceptions\InvalidTestPriceException;
use App\Exceptions\DrugStockException;
use App\Exceptions\MasterDataValidationException;
use App\Models\Department;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;

class MasterDataExceptionService
{
    /**
     * Throw department in use exception
     */
    public static function throwDepartmentInUse(Department $department, array $references = []): void
    {
        throw new DepartmentInUseException($department, $references);
    }

    /**
     * Throw bed occupancy conflict exception
     */
    public static function throwBedOccupancyConflict(
        Bed $bed, 
        string $conflictType, 
        string $currentStatus = null, 
        string $requestedStatus = null
    ): void {
        throw new BedOccupancyConflictException($bed, $conflictType, $currentStatus, $requestedStatus);
    }

    /**
     * Throw invalid test price exception
     */
    public static function throwInvalidTestPrice(
        TestCatalog $testCatalog, 
        float $currentPrice, 
        float $requestedPrice, 
        string $validationType, 
        int $pendingOrders = 0
    ): void {
        throw new InvalidTestPriceException($testCatalog, $currentPrice, $requestedPrice, $validationType, $pendingOrders);
    }

    /**
     * Throw drug stock exception
     */
    public static function throwDrugStockError(
        DrugFormulary $drugFormulary, 
        string $operationType, 
        int $requestedQuantity = 0, 
        int $currentStock = null, 
        int $reorderLevel = null
    ): void {
        throw new DrugStockException($drugFormulary, $operationType, $requestedQuantity, $currentStock, $reorderLevel);
    }

    /**
     * Throw master data validation exception
     */
    public static function throwValidationError(
        string $entityType, 
        $entityId, 
        array $validationErrors, 
        array $businessRules = []
    ): void {
        throw new MasterDataValidationException($entityType, $entityId, $validationErrors, $businessRules);
    }

    /**
     * Check department references and throw exception if in use
     */
    public static function checkDepartmentReferences(Department $department): void
    {
        $references = [];

        // Check wards
        $wardsCount = $department->wards()->count();
        if ($wardsCount > 0) {
            $references[] = ['type' => 'wards', 'count' => $wardsCount];
        }

        // Check test catalogs
        $testsCount = $department->testCatalogs()->count();
        if ($testsCount > 0) {
            $references[] = ['type' => 'test catalogs', 'count' => $testsCount];
        }

        // Check if department is used in any other entities (extend as needed)
        // Example: Check if department is referenced in patient records, staff assignments, etc.

        if (!empty($references)) {
            self::throwDepartmentInUse($department, $references);
        }
    }

    /**
     * Validate bed status transition
     */
    public static function validateBedStatusTransition(Bed $bed, string $newStatus): void
    {
        $currentStatus = $bed->status;

        // Define invalid transitions
        $invalidTransitions = [
            'occupied' => ['maintenance', 'out_of_order'],
            'maintenance' => ['occupied'],
            'out_of_order' => ['occupied'],
        ];

        if (isset($invalidTransitions[$currentStatus]) && 
            in_array($newStatus, $invalidTransitions[$currentStatus])) {
            
            $conflictType = match($newStatus) {
                'maintenance' => 'occupied_to_maintenance',
                'out_of_order' => 'occupied_to_out_of_order',
                default => 'invalid_status_transition'
            };

            self::throwBedOccupancyConflict($bed, $conflictType, $currentStatus, $newStatus);
        }
    }

    /**
     * Validate test price change
     */
    public static function validateTestPriceChange(TestCatalog $testCatalog, float $newPrice, bool $forceUpdate = false): void
    {
        $currentPrice = $testCatalog->price;

        // Check for significant price changes (more than 50%)
        if (!$forceUpdate && $currentPrice > 0) {
            $priceChangePercentage = abs(($newPrice - $currentPrice) / $currentPrice) * 100;
            
            if ($priceChangePercentage > 50) {
                self::throwInvalidTestPrice($testCatalog, $currentPrice, $newPrice, 'significant_change');
            }
        }

        // Check for pending orders (this would require integration with orders system)
        // For now, we'll skip this check as the orders table structure isn't defined
        
        // Check price precision
        if (round($newPrice, 2) != $newPrice) {
            self::throwInvalidTestPrice($testCatalog, $currentPrice, $newPrice, 'precision_error');
        }

        // Check price range
        if ($newPrice < 0 || $newPrice > 999999.99) {
            self::throwInvalidTestPrice($testCatalog, $currentPrice, $newPrice, 'invalid_range');
        }
    }

    /**
     * Validate drug stock operation
     */
    public static function validateDrugStockOperation(DrugFormulary $drug, string $operation, int $quantity = 0): void
    {
        $currentStock = $drug->stock_quantity;
        $reorderLevel = $drug->reorder_level;

        switch ($operation) {
            case 'dispense':
                if ($quantity > $currentStock) {
                    self::throwDrugStockError($drug, 'insufficient_stock', $quantity, $currentStock);
                }
                
                $newStock = $currentStock - $quantity;
                if ($newStock <= $reorderLevel) {
                    self::throwDrugStockError($drug, 'below_reorder_level', $quantity, $newStock, $reorderLevel);
                }
                break;

            case 'adjust':
                if ($quantity < 0) {
                    self::throwDrugStockError($drug, 'negative_stock', $quantity);
                }
                break;

            case 'reorder_level':
                if ($quantity > $currentStock) {
                    self::throwDrugStockError($drug, 'invalid_reorder_level', $quantity, $currentStock, $quantity);
                }
                break;

            default:
                self::throwDrugStockError($drug, 'stock_adjustment_error', $quantity);
        }
    }

    /**
     * Validate ward capacity constraints
     */
    public static function validateWardCapacity($ward, int $newCapacity): void
    {
        if ($ward) {
            $currentBedCount = $ward->beds()->count();
            $occupiedBeds = $ward->beds()->where('status', 'occupied')->count();

            if ($newCapacity < $currentBedCount) {
                self::throwValidationError('ward', $ward->id, [
                    'capacity' => "Cannot reduce capacity below current bed count ({$currentBedCount})"
                ]);
            }

            if ($newCapacity < $occupiedBeds) {
                self::throwValidationError('ward', $ward->id, [
                    'capacity' => "Cannot reduce capacity below occupied beds count ({$occupiedBeds})"
                ]);
            }
        }
    }
}