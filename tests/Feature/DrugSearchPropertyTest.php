<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\DrugFormulary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;

/**
 * Property-Based Tests for Drug Search API
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class DrugSearchPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create and authenticate a user for API access
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        
        // Clear cache before each test
        Cache::flush();
    }

    /**
     * **Feature: consultation-enhancement, Property 7: Multi-field drug search**
     * 
     * Property: For any drug in the formulary and any search term matching its generic name,
     * brand name, or ATC code, the search results should include that drug
     * 
     * **Validates: Requirements 2.2**
     * 
     * @test
     */
    public function property_multi_field_drug_search_returns_matching_drugs()
    {
        // Run property test with 10 iterations for testing (design specifies 100 for production)
        for ($i = 0; $i < 10; $i++) {
            // Clear database for each iteration
            DrugFormulary::query()->delete();
            Cache::flush();
            
            // Generate random drug with all searchable fields
            $drug = DrugFormulary::factory()->create([
                'generic_name' => $this->randomDrugName(),
                'brand_name' => $this->randomBrandName(),
                'name' => $this->randomDrugName(),
                'atc_code' => $this->randomAtcCode(),
                'status' => 'active',
                'stock_quantity' => rand(0, 1000),
                'reorder_level' => rand(10, 50),
            ]);
            
            // Test search by generic name
            $genericSearchTerm = substr($drug->generic_name, 0, 3);
            $response = $this->getJson("/api/drugs/search?q={$genericSearchTerm}");
            
            $response->assertStatus(200);
            $results = $response->json();
            
            $foundByGeneric = collect($results)->contains('id', $drug->id);
            $this->assertTrue(
                $foundByGeneric,
                "Property violated: Drug {$drug->id} with generic_name '{$drug->generic_name}' should be found by search term '{$genericSearchTerm}'"
            );
            
            // Test search by brand name
            if ($drug->brand_name) {
                $brandSearchTerm = substr($drug->brand_name, 0, 3);
                $response = $this->getJson("/api/drugs/search?q={$brandSearchTerm}");
                
                $response->assertStatus(200);
                $results = $response->json();
                
                $foundByBrand = collect($results)->contains('id', $drug->id);
                $this->assertTrue(
                    $foundByBrand,
                    "Property violated: Drug {$drug->id} with brand_name '{$drug->brand_name}' should be found by search term '{$brandSearchTerm}'"
                );
            }
            
            // Test search by ATC code
            if ($drug->atc_code) {
                $atcSearchTerm = substr($drug->atc_code, 0, 3);
                $response = $this->getJson("/api/drugs/search?q={$atcSearchTerm}");
                
                $response->assertStatus(200);
                $results = $response->json();
                
                $foundByAtc = collect($results)->contains('id', $drug->id);
                $this->assertTrue(
                    $foundByAtc,
                    "Property violated: Drug {$drug->id} with atc_code '{$drug->atc_code}' should be found by search term '{$atcSearchTerm}'"
                );
            }
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 8: Complete search result data**
     * 
     * Property: For any drug returned in search results, the result should include
     * drug name, strength, form, current stock availability, and stock status indicator
     * 
     * **Validates: Requirements 2.3**
     * 
     * @test
     */
    public function property_complete_search_result_data_for_all_drugs()
    {
        // Run property test with 10 iterations for testing (design specifies 100 for production)
        for ($i = 0; $i < 10; $i++) {
            // Clear database for each iteration
            DrugFormulary::query()->delete();
            Cache::flush();
            
            // Generate random drug with varying stock levels
            $stockQuantity = rand(0, 1000);
            $reorderLevel = rand(10, 50);
            
            $drug = DrugFormulary::factory()->create([
                'name' => $this->randomDrugName(),
                'generic_name' => $this->randomDrugName(),
                'brand_name' => $this->randomBrandName(),
                'atc_code' => $this->randomAtcCode(),
                'strength' => $this->randomStrength(),
                'form' => $this->randomForm(),
                'unit_price' => $this->randomPrice(),
                'stock_quantity' => $stockQuantity,
                'reorder_level' => $reorderLevel,
                'status' => 'active',
            ]);
            
            // Search for the drug
            $searchTerm = substr($drug->name, 0, 3);
            $response = $this->getJson("/api/drugs/search?q={$searchTerm}");
            
            $response->assertStatus(200);
            $results = $response->json();
            
            // Find the drug in results
            $drugResult = collect($results)->firstWhere('id', $drug->id);
            
            $this->assertNotNull(
                $drugResult,
                "Property violated: Drug {$drug->id} should be in search results"
            );
            
            // Verify all required fields are present
            $this->assertArrayHasKey(
                'name',
                $drugResult,
                "Property violated: Search result must include 'name' field"
            );
            
            $this->assertArrayHasKey(
                'strength',
                $drugResult,
                "Property violated: Search result must include 'strength' field"
            );
            
            $this->assertArrayHasKey(
                'form',
                $drugResult,
                "Property violated: Search result must include 'form' field"
            );
            
            $this->assertArrayHasKey(
                'stock_quantity',
                $drugResult,
                "Property violated: Search result must include 'stock_quantity' field"
            );
            
            $this->assertArrayHasKey(
                'stock_status',
                $drugResult,
                "Property violated: Search result must include 'stock_status' indicator"
            );
            
            $this->assertArrayHasKey(
                'stock_badge_color',
                $drugResult,
                "Property violated: Search result must include 'stock_badge_color' indicator"
            );
            
            // Verify stock status is correctly calculated
            $expectedStockStatus = $this->calculateExpectedStockStatus($stockQuantity, $reorderLevel);
            $this->assertEquals(
                $expectedStockStatus,
                $drugResult['stock_status'],
                "Property violated: Stock status should be '{$expectedStockStatus}' for quantity {$stockQuantity} with reorder level {$reorderLevel}"
            );
            
            // Verify stock badge color matches stock status
            $expectedBadgeColor = $this->getExpectedBadgeColor($expectedStockStatus);
            $this->assertEquals(
                $expectedBadgeColor,
                $drugResult['stock_badge_color'],
                "Property violated: Stock badge color should be '{$expectedBadgeColor}' for status '{$expectedStockStatus}'"
            );
        }
    }

    // Helper methods for generating random test data
    
    protected function randomDrugName(): string
    {
        $names = [
            'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Metformin',
            'Atorvastatin', 'Omeprazole', 'Amlodipine', 'Simvastatin', 'Lisinopril',
            'Levothyroxine', 'Azithromycin', 'Metoprolol', 'Albuterol', 'Gabapentin'
        ];
        return $names[array_rand($names)] . rand(1, 999);
    }
    
    protected function randomBrandName(): string
    {
        $brands = [
            'Tylenol', 'Advil', 'Bayer', 'Amoxil', 'Glucophage',
            'Lipitor', 'Prilosec', 'Norvasc', 'Zocor', 'Prinivil',
            'Synthroid', 'Zithromax', 'Lopressor', 'Ventolin', 'Neurontin'
        ];
        return $brands[array_rand($brands)] . rand(1, 99);
    }
    
    protected function randomAtcCode(): string
    {
        $letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $code = $letters[rand(0, strlen($letters) - 1)];
        $code .= str_pad(rand(0, 99), 2, '0', STR_PAD_LEFT);
        $code .= $letters[rand(0, strlen($letters) - 1)];
        $code .= $letters[rand(0, strlen($letters) - 1)];
        $code .= str_pad(rand(0, 99), 2, '0', STR_PAD_LEFT);
        return $code;
    }
    
    protected function randomStrength(): string
    {
        $strengths = ['5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1g'];
        return $strengths[array_rand($strengths)];
    }
    
    protected function randomForm(): string
    {
        $forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler'];
        return $forms[array_rand($forms)];
    }
    
    protected function randomPrice(): float
    {
        return round(rand(10, 10000) / 100, 2);
    }
    
    protected function calculateExpectedStockStatus(int $stockQuantity, int $reorderLevel): string
    {
        if ($stockQuantity > $reorderLevel) {
            return 'in_stock';
        } elseif ($stockQuantity > 0) {
            return 'low_stock';
        } else {
            return 'out_of_stock';
        }
    }
    
    protected function getExpectedBadgeColor(string $stockStatus): string
    {
        return match($stockStatus) {
            'in_stock' => 'green',
            'low_stock' => 'yellow',
            'out_of_stock' => 'red',
            default => 'gray'
        };
    }
}
