<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DrugStockException extends Exception
{
    protected $drugFormulary;
    protected $operationType;
    protected $requestedQuantity;
    protected $currentStock;
    protected $reorderLevel;

    public function __construct($drugFormulary, string $operationType, int $requestedQuantity = 0, int $currentStock = null, int $reorderLevel = null, $message = null)
    {
        $this->drugFormulary = $drugFormulary;
        $this->operationType = $operationType;
        $this->requestedQuantity = $requestedQuantity;
        $this->currentStock = $currentStock ?? $drugFormulary->stock_quantity;
        $this->reorderLevel = $reorderLevel ?? $drugFormulary->reorder_level;
        
        $defaultMessage = match($operationType) {
            'insufficient_stock' => "Insufficient stock for drug '{$drugFormulary->name}'. Available: {$this->currentStock}, Requested: {$requestedQuantity}.",
            'below_reorder_level' => "Stock for drug '{$drugFormulary->name}' is below reorder level. Current: {$this->currentStock}, Reorder level: {$this->reorderLevel}.",
            'negative_stock' => "Cannot set negative stock quantity for drug '{$drugFormulary->name}'.",
            'invalid_reorder_level' => "Reorder level {$reorderLevel} is invalid for drug '{$drugFormulary->name}'. Must be less than or equal to current stock.",
            'stock_adjustment_error' => "Stock adjustment failed for drug '{$drugFormulary->name}'. Invalid operation.",
            default => "Stock operation failed for drug '{$drugFormulary->name}'."
        };
        
        parent::__construct($message ?? $defaultMessage);
    }

    public function getDrugFormulary()
    {
        return $this->drugFormulary;
    }

    public function getOperationType(): string
    {
        return $this->operationType;
    }

    public function getRequestedQuantity(): int
    {
        return $this->requestedQuantity;
    }

    public function getCurrentStock(): int
    {
        return $this->currentStock;
    }

    public function getReorderLevel(): int
    {
        return $this->reorderLevel;
    }

    public function render(Request $request): JsonResponse
    {
        $suggestions = match($this->operationType) {
            'insufficient_stock' => [
                'Check available stock before dispensing',
                'Reduce requested quantity',
                'Order more stock from supplier',
                'Use substitute drugs if available'
            ],
            'below_reorder_level' => [
                'Place order with supplier immediately',
                'Check substitute drugs availability',
                'Adjust reorder level if needed',
                'Set up automatic reorder alerts'
            ],
            'negative_stock' => [
                'Ensure stock quantity is zero or positive',
                'Check for data entry errors',
                'Verify stock adjustment calculations'
            ],
            'invalid_reorder_level' => [
                'Set reorder level below current stock',
                'Adjust reorder level based on usage patterns',
                'Consider lead time for supplier orders'
            ],
            'stock_adjustment_error' => [
                'Verify adjustment calculations',
                'Check for concurrent stock operations',
                'Contact pharmacy manager for assistance'
            ],
            default => ['Contact system administrator for assistance']
        };

        $stockStatus = 'unknown';
        if ($this->currentStock <= 0) {
            $stockStatus = 'out_of_stock';
        } elseif ($this->currentStock <= $this->reorderLevel) {
            $stockStatus = 'low_stock';
        } else {
            $stockStatus = 'in_stock';
        }

        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'DRUG_STOCK_ERROR',
            'operation_type' => $this->operationType,
            'drug' => [
                'id' => $this->drugFormulary->id,
                'name' => $this->drugFormulary->name,
                'generic_name' => $this->drugFormulary->generic_name,
                'strength' => $this->drugFormulary->strength,
                'form' => $this->drugFormulary->form,
            ],
            'stock_details' => [
                'current_stock' => $this->currentStock,
                'requested_quantity' => $this->requestedQuantity,
                'reorder_level' => $this->reorderLevel,
                'stock_status' => $stockStatus,
            ],
            'suggestions' => $suggestions
        ], 422);
    }
}
