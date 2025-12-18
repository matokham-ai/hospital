<?php

namespace Tests\Unit\Models;

use App\Models\Icd10Code;
use App\Models\OpdDiagnosis;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Icd10CodeTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_be_created_with_valid_data()
    {
        $icd10Code = Icd10Code::factory()->create([
            'code' => 'I10',
            'description' => 'Essential (primary) hypertension',
            'category' => 'Circulatory',
            'subcategory' => 'Hypertensive diseases',
            'usage_count' => 0,
            'is_active' => true,
        ]);

        $this->assertInstanceOf(Icd10Code::class, $icd10Code);
        $this->assertEquals('I10', $icd10Code->code);
        $this->assertEquals('Essential (primary) hypertension', $icd10Code->description);
        $this->assertEquals('Circulatory', $icd10Code->category);
        $this->assertTrue($icd10Code->is_active);
    }

    /** @test */
    public function it_casts_fields_correctly()
    {
        $icd10Code = Icd10Code::factory()->create([
            'is_active' => true,
            'usage_count' => 25,
        ]);

        $this->assertIsBool($icd10Code->is_active);
        $this->assertIsInt($icd10Code->usage_count);
        $this->assertTrue($icd10Code->is_active);
        $this->assertEquals(25, $icd10Code->usage_count);
    }

    /** @test */
    public function it_has_many_diagnoses()
    {
        $icd10Code = Icd10Code::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $icd10Code->diagnoses());
    }

    /** @test */
    public function active_scope_filters_active_codes()
    {
        $activeCode = Icd10Code::factory()->create(['is_active' => true]);
        $inactiveCode = Icd10Code::factory()->create(['is_active' => false]);

        $activeCodes = Icd10Code::active()->get();

        $this->assertCount(1, $activeCodes);
        $this->assertTrue($activeCodes->contains($activeCode));
        $this->assertFalse($activeCodes->contains($inactiveCode));
    }

    /** @test */
    public function popular_scope_returns_most_used_codes()
    {
        $popularCode1 = Icd10Code::factory()->create(['usage_count' => 100]);
        $popularCode2 = Icd10Code::factory()->create(['usage_count' => 80]);
        $unpopularCode = Icd10Code::factory()->create(['usage_count' => 5]);

        $popularCodes = Icd10Code::popular(2)->get();

        $this->assertCount(2, $popularCodes);
        $this->assertEquals($popularCode1->id, $popularCodes->first()->id);
        $this->assertEquals($popularCode2->id, $popularCodes->last()->id);
        $this->assertFalse($popularCodes->contains($unpopularCode));
    }

    /** @test */
    public function popular_scope_only_returns_active_codes()
    {
        $activePopularCode = Icd10Code::factory()->create([
            'usage_count' => 100,
            'is_active' => true,
        ]);

        $inactivePopularCode = Icd10Code::factory()->create([
            'usage_count' => 150,
            'is_active' => false,
        ]);

        $popularCodes = Icd10Code::popular()->get();

        $this->assertTrue($popularCodes->contains($activePopularCode));
        $this->assertFalse($popularCodes->contains($inactivePopularCode));
    }

    /** @test */
    public function by_category_scope_filters_by_category()
    {
        $respiratoryCode = Icd10Code::factory()->create([
            'code' => 'J10',
            'category' => 'Respiratory',
            'is_active' => true,
        ]);
        $cardiovascularCode = Icd10Code::factory()->create([
            'code' => 'I10',
            'category' => 'Circulatory',
            'is_active' => true,
        ]);

        $respiratoryCodes = Icd10Code::byCategory('Respiratory')->get();

        $this->assertCount(1, $respiratoryCodes);
        $this->assertTrue($respiratoryCodes->contains($respiratoryCode));
        $this->assertFalse($respiratoryCodes->contains($cardiovascularCode));
    }

    /** @test */
    public function by_category_scope_only_returns_active_codes()
    {
        $activeRespiratoryCode = Icd10Code::factory()->create([
            'category' => 'Respiratory',
            'is_active' => true,
        ]);

        $inactiveRespiratoryCode = Icd10Code::factory()->create([
            'category' => 'Respiratory',
            'is_active' => false,
        ]);

        $respiratoryCodes = Icd10Code::byCategory('Respiratory')->get();

        $this->assertTrue($respiratoryCodes->contains($activeRespiratoryCode));
        $this->assertFalse($respiratoryCodes->contains($inactiveRespiratoryCode));
    }

    /** @test */
    public function it_increments_usage_count()
    {
        $icd10Code = Icd10Code::factory()->create(['usage_count' => 10]);

        $icd10Code->incrementUsage();

        $this->assertEquals(11, $icd10Code->fresh()->usage_count);
    }

    /** @test */
    public function it_searches_by_code_and_description()
    {
        $hypertensionCode = Icd10Code::factory()->create([
            'code' => 'I10',
            'description' => 'Essential (primary) hypertension',
            'is_active' => true,
        ]);

        $diabetesCode = Icd10Code::factory()->create([
            'code' => 'E11.9',
            'description' => 'Type 2 diabetes mellitus without complications',
            'is_active' => true,
        ]);

        // Search by code
        $codeResults = Icd10Code::search('I10');
        $this->assertCount(1, $codeResults);
        $this->assertTrue($codeResults->contains($hypertensionCode));

        // Search by description
        $descriptionResults = Icd10Code::search('diabetes');
        $this->assertCount(1, $descriptionResults);
        $this->assertTrue($descriptionResults->contains($diabetesCode));

        // Search by partial description
        $partialResults = Icd10Code::search('hypertension');
        $this->assertCount(1, $partialResults);
        $this->assertTrue($partialResults->contains($hypertensionCode));
    }

    /** @test */
    public function search_only_returns_active_codes()
    {
        $activeCode = Icd10Code::factory()->create([
            'code' => 'I10',
            'description' => 'Essential hypertension',
            'is_active' => true,
        ]);

        $inactiveCode = Icd10Code::factory()->create([
            'code' => 'I11',
            'description' => 'Hypertensive heart disease',
            'is_active' => false,
        ]);

        $results = Icd10Code::search('hypertension');

        $this->assertTrue($results->contains($activeCode));
        $this->assertFalse($results->contains($inactiveCode));
    }

    /** @test */
    public function search_orders_by_usage_count()
    {
        $lessUsedCode = Icd10Code::factory()->create([
            'code' => 'I10',
            'description' => 'Essential Hypertension',
            'usage_count' => 10,
            'is_active' => true,
        ]);

        $moreUsedCode = Icd10Code::factory()->create([
            'code' => 'I11',
            'description' => 'Hypertensive Heart Disease',
            'usage_count' => 50,
            'is_active' => true,
        ]);

        $results = Icd10Code::search('Hypertens');

        $this->assertGreaterThanOrEqual(2, $results->count());
        
        // Find our specific codes in the results
        $foundLessUsed = $results->where('id', $lessUsedCode->id)->first();
        $foundMoreUsed = $results->where('id', $moreUsedCode->id)->first();
        
        $this->assertNotNull($foundLessUsed);
        $this->assertNotNull($foundMoreUsed);
        
        // Check that more used code appears before less used code
        $moreUsedIndex = $results->search(function($item) use ($moreUsedCode) {
            return $item->id === $moreUsedCode->id;
        });
        
        $lessUsedIndex = $results->search(function($item) use ($lessUsedCode) {
            return $item->id === $lessUsedCode->id;
        });
        
        $this->assertLessThan($lessUsedIndex, $moreUsedIndex);
    }

    /** @test */
    public function search_respects_limit()
    {
        // Create multiple codes that match the search term
        for ($i = 1; $i <= 25; $i++) {
            Icd10Code::factory()->create([
                'code' => "I{$i}",
                'description' => "Hypertension type {$i}",
                'is_active' => true,
            ]);
        }

        $results = Icd10Code::search('hypertension', 10);

        $this->assertCount(10, $results);
    }

    /** @test */
    public function search_handles_case_insensitive_queries()
    {
        $code = Icd10Code::factory()->create([
            'code' => 'I10',
            'description' => 'Essential Hypertension',
            'is_active' => true,
        ]);

        $exactCaseResults = Icd10Code::search('Hypertension');
        $lowerCaseResults = Icd10Code::search('hypertension');
        $upperCaseResults = Icd10Code::search('HYPERTENSION');

        $this->assertCount(1, $exactCaseResults);
        $this->assertCount(1, $lowerCaseResults);
        $this->assertCount(1, $upperCaseResults);

        $this->assertTrue($exactCaseResults->contains($code));
        $this->assertTrue($lowerCaseResults->contains($code));
        $this->assertTrue($upperCaseResults->contains($code));
    }

    /** @test */
    public function it_handles_empty_search_term()
    {
        Icd10Code::factory()->count(5)->create(['is_active' => true]);

        $results = Icd10Code::search('');

        // Should return all active codes when search term is empty
        $this->assertCount(5, $results);
    }

    /** @test */
    public function it_validates_code_uniqueness()
    {
        Icd10Code::factory()->create(['code' => 'I10']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Attempting to create another code with the same code should fail
        Icd10Code::factory()->create(['code' => 'I10']);
    }

    /** @test */
    public function it_stores_hierarchical_category_information()
    {
        $code = Icd10Code::factory()->create([
            'category' => 'Diseases of the circulatory system',
            'subcategory' => 'Hypertensive diseases',
        ]);

        $this->assertEquals('Diseases of the circulatory system', $code->category);
        $this->assertEquals('Hypertensive diseases', $code->subcategory);
    }

    /** @test */
    public function it_can_track_usage_statistics()
    {
        $code = Icd10Code::factory()->create(['usage_count' => 0]);

        // Simulate multiple uses
        for ($i = 0; $i < 5; $i++) {
            $code->incrementUsage();
        }

        $this->assertEquals(5, $code->fresh()->usage_count);
    }
}