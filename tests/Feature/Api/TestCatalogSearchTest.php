<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\TestCatalog;
use App\Models\Department;
use App\Models\TestCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TestCatalogSearchTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Department $department;
    protected TestCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        
        $this->department = Department::create([
            'deptid' => 'LAB001',
            'name' => 'Laboratory',
            'code' => 'LAB',
            'status' => 'active',
        ]);

        $this->category = TestCategory::create([
            'name' => 'Hematology',
            'description' => 'Blood tests',
        ]);
    }

    /** @test */
    public function it_can_search_tests_with_query()
    {
        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'active',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Blood Sugar',
            'code' => 'BS001',
            'price' => 15.00,
            'turnaround_time' => 12,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/test-catalogs/search/advanced?query=blood');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    /** @test */
    public function it_can_filter_by_category()
    {
        $category2 = TestCategory::create([
            'name' => 'Biochemistry',
            'description' => 'Chemistry tests',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'active',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $category2->id,
            'name' => 'Liver Function Test',
            'code' => 'LFT001',
            'price' => 35.00,
            'turnaround_time' => 48,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/test-catalogs/search/advanced?category=Hematology');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Complete Blood Count']);
    }

    /** @test */
    public function it_includes_turnaround_time_in_results()
    {
        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/test-catalogs/search/advanced?query=CBC');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Complete Blood Count',
                'turnaround_time' => 24,
            ]);
    }

    /** @test */
    public function it_can_filter_by_turnaround_time_range()
    {
        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Quick Test',
            'code' => 'QT001',
            'price' => 20.00,
            'turnaround_time' => 6,
            'status' => 'active',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Standard Test',
            'code' => 'ST001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'active',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Slow Test',
            'code' => 'SL001',
            'price' => 30.00,
            'turnaround_time' => 72,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/test-catalogs/search/advanced?min_turnaround_time=12&max_turnaround_time=48');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Standard Test']);
    }

    /** @test */
    public function it_defaults_to_active_tests_only()
    {
        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Active Test',
            'code' => 'AT001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'active',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Inactive Test',
            'code' => 'IT001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'inactive',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/test-catalogs/search/advanced');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Active Test'])
            ->assertJsonMissing(['name' => 'Inactive Test']);
    }

    /** @test */
    public function it_can_combine_multiple_filters()
    {
        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Complete Blood Count',
            'code' => 'CBC001',
            'price' => 25.00,
            'turnaround_time' => 24,
            'status' => 'active',
        ]);

        TestCatalog::create([
            'deptid' => $this->department->deptid,
            'category_id' => $this->category->id,
            'name' => 'Blood Sugar',
            'code' => 'BS001',
            'price' => 15.00,
            'turnaround_time' => 12,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/test-catalogs/search/advanced?query=blood&min_turnaround_time=20');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Complete Blood Count']);
    }
}
