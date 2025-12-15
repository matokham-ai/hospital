<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterDataValidationException extends Exception
{
    protected $entityType;
    protected $entityId;
    protected $validationErrors;
    protected $businessRules;

    public function __construct(string $entityType, $entityId, array $validationErrors, array $businessRules = [], $message = null)
    {
        $this->entityType = $entityType;
        $this->entityId = $entityId;
        $this->validationErrors = $validationErrors;
        $this->businessRules = $businessRules;
        
        $errorCount = count($validationErrors);
        $defaultMessage = "Validation failed for {$entityType}";
        if ($entityId) {
            $defaultMessage .= " (ID: {$entityId})";
        }
        $defaultMessage .= " with {$errorCount} error(s).";
        
        parent::__construct($message ?? $defaultMessage);
    }

    public function getEntityType(): string
    {
        return $this->entityType;
    }

    public function getEntityId()
    {
        return $this->entityId;
    }

    public function getValidationErrors(): array
    {
        return $this->validationErrors;
    }

    public function getBusinessRules(): array
    {
        return $this->businessRules;
    }

    public function render(Request $request): JsonResponse
    {
        $suggestions = [
            'Review the validation errors below',
            'Ensure all required fields are provided',
            'Check data format and constraints',
            'Verify business rule compliance'
        ];

        // Add entity-specific suggestions
        $entitySuggestions = match($this->entityType) {
            'department' => [
                'Department codes must be unique and follow naming conventions',
                'Check if department has active references before deletion'
            ],
            'ward' => [
                'Ward capacity must not exceed department limits',
                'Ensure ward has available beds before reducing capacity'
            ],
            'bed' => [
                'Bed numbers must be unique within the ward',
                'Cannot change occupied bed status without proper workflow'
            ],
            'test_catalog' => [
                'Test codes must be unique across all departments',
                'Price changes over 50% require confirmation'
            ],
            'drug_formulary' => [
                'ATC codes must follow international standards',
                'Stock levels must be non-negative'
            ],
            default => []
        };

        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'MASTER_DATA_VALIDATION_ERROR',
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'validation_errors' => $this->validationErrors,
            'business_rules' => $this->businessRules,
            'suggestions' => array_merge($suggestions, $entitySuggestions)
        ], 422);
    }
}
