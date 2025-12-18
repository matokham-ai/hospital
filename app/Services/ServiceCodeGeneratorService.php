<?php

namespace App\Services;

use App\Models\ServiceCatalogue;
use App\Models\Department;

class ServiceCodeGeneratorService
{
    /**
     * Generate a unique service code based on category and department
     */
    public function generateCode(string $category, ?int $departmentId = null): string
    {
        $prefix = $this->getCategoryPrefix($category);
        
        if ($departmentId) {
            $department = Department::find($departmentId);
            if ($department && $department->code) {
                $prefix .= strtoupper(substr($department->code, 0, 2));
            }
        }
        
        // Get the next sequential number for this prefix
        $nextNumber = $this->getNextSequentialNumber($prefix);
        
        return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get category prefix for service codes
     */
    private function getCategoryPrefix(string $category): string
    {
        $prefixes = [
            ServiceCatalogue::CATEGORY_CONSULTATION => 'CONS',
            ServiceCatalogue::CATEGORY_LAB_TEST => 'LAB',
            ServiceCatalogue::CATEGORY_IMAGING => 'IMG',
            ServiceCatalogue::CATEGORY_PROCEDURE => 'PROC',
            ServiceCatalogue::CATEGORY_MEDICATION => 'MED',
            ServiceCatalogue::CATEGORY_CONSUMABLE => 'CONS',
            ServiceCatalogue::CATEGORY_BED_CHARGE => 'BED',
            ServiceCatalogue::CATEGORY_NURSING => 'NURS',
            ServiceCatalogue::CATEGORY_OTHER => 'OTH',
        ];

        return $prefixes[$category] ?? 'SVC';
    }

    /**
     * Get the next sequential number for a given prefix
     */
    private function getNextSequentialNumber(string $prefix): int
    {
        $lastService = ServiceCatalogue::where('code', 'like', $prefix . '%')
            ->orderBy('code', 'desc')
            ->first();

        if (!$lastService) {
            return 1;
        }

        // Extract the number from the last code
        $lastCode = $lastService->code;
        $numberPart = substr($lastCode, strlen($prefix));
        
        return (int)$numberPart + 1;
    }

    /**
     * Check if a code already exists
     */
    public function codeExists(string $code): bool
    {
        return ServiceCatalogue::where('code', $code)->exists();
    }

    /**
     * Generate multiple code suggestions
     */
    public function generateCodeSuggestions(string $category, ?int $departmentId = null, int $count = 3): array
    {
        $suggestions = [];
        $baseCode = $this->generateCode($category, $departmentId);
        
        // First suggestion is the standard generated code
        $suggestions[] = $baseCode;
        
        // Additional suggestions with variations
        for ($i = 1; $i < $count; $i++) {
            $variation = $this->generateCodeVariation($category, $departmentId, $i);
            if (!in_array($variation, $suggestions)) {
                $suggestions[] = $variation;
            }
        }
        
        return $suggestions;
    }

    /**
     * Generate code variations
     */
    private function generateCodeVariation(string $category, ?int $departmentId, int $variation): string
    {
        $prefix = $this->getCategoryPrefix($category);
        
        if ($departmentId && $variation === 1) {
            // Try without department code
            $nextNumber = $this->getNextSequentialNumber($prefix);
            return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        }
        
        if ($departmentId && $variation === 2) {
            // Try with full department code
            $department = Department::find($departmentId);
            if ($department && $department->code) {
                $prefix .= strtoupper($department->code);
                $nextNumber = $this->getNextSequentialNumber($prefix);
                return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            }
        }
        
        // Fallback: add variation suffix
        $nextNumber = $this->getNextSequentialNumber($prefix);
        return $prefix . str_pad($nextNumber + $variation, 3, '0', STR_PAD_LEFT);
    }
}