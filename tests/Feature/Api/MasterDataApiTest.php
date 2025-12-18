<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Ward;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class MasterDataApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $authenticatedUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a basic role and user for authentication
        $userRole = Role::create(['name' => 'User']);
        
        $this->authenticatedUser = User::factory()->create();
        $this->authenticatedUser->assignRole($userRole);
    }

    /** @test */
    public function authenticated_user_can_get_department_options()
    {
        Department::factory()->count(3)->create(['status' => 'active']);
        Department::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/departments/options');

        $response->assertStatus(200)
            ->assertJsonCount(3) // Only active departments
            ->assertJsonStructure([
                '*' => ['id', 'name']
            ]);
    }

    /** @test */
    public function authenticated_user_can_get_ward_options()
    {
        Ward::factory()->count(4)->create(['status' => 'active']);
        Ward::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/wards/options');

        $response->assertStatus(200)
            ->assertJsonCount(4) // Only active wards
            ->assertJsonStructure([
                '*' => ['id', 'name', 'type']
            ]);
    }

    /** @test */
    public function authenticated_user_can_get_test_catalog_options()
    {
        TestCatalog::factory()->count(5)->create(['status' => 'active']);
        TestCatalog::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/test-catalogs/options');

        $response->assertStatus(200)
            ->assertJsonCount(5) // Only active test catalogs
            ->assertJsonStructure([
                '*' => ['id', 'name', 'code', 'price']
            ]);
    }

    /** @test */
    public function authenticated_user_can_get_drug_formulary_options()
    {
        DrugFormulary::factory()->count(6)->create(['status' => 'active']);
        DrugFormulary::factory()->create(['status' => 'discontinued']);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/drug-formulary/options');

        $response->assertStatus(200)
            ->assertJsonCount(6) // Only active drugs
            ->assertJsonStructure([
                '*' => ['id', 'name', 'generic_name', 'strength', 'form']
            ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_master_data_options()
    {
        $endpoints = [
            '/api/master-data/departments/options',
            '/api/master-data/wards/options',
            '/api/master-data/test-catalogs/options',
            '/api/master-data/drug-formulary/options'
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $response->assertStatus(401);
        }
    }

    /** @test */
    public function master_data_options_return_empty_array_when_no_active_records()
    {
        // Create only inactive records
        Department::factory()->create(['status' => 'inactive']);
        Ward::factory()->create(['status' => 'inactive']);
        TestCatalog::factory()->create(['status' => 'inactive']);
        DrugFormulary::factory()->create(['status' => 'discontinued']);

        $endpoints = [
            '/api/master-data/departments/options',
            '/api/master-data/wards/options',
            '/api/master-data/test-catalogs/options',
            '/api/master-data/drug-formulary/options'
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->actingAs($this->authenticatedUser)
                ->getJson($endpoint);

            $response->assertStatus(200)
                ->assertJsonCount(0);
        }
    }

    /** @test */
    public function master_data_options_are_ordered_correctly()
    {
        // Create departments with specific names to test ordering
        Department::factory()->create(['name' => 'Cardiology', 'status' => 'active']);
        Department::factory()->create(['name' => 'Neurology', 'status' => 'active']);
        Department::factory()->create(['name' => 'Emergency', 'status' => 'active']);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/departments/options');

        $response->assertStatus(200);

        $departments = $response->json();
        
        // Should be ordered alphabetically by name
        $this->assertEquals('Cardiology', $departments[0]['name']);
        $this->assertEquals('Emergency', $departments[1]['name']);
        $this->assertEquals('Neurology', $departments[2]['name']);
    }

    /** @test */
    public function ward_options_include_department_information()
    {
        $department = Department::factory()->create(['name' => 'Surgery']);
        Ward::factory()->create([
            'name' => 'Surgical Ward',
            'department_id' => $department->id,
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/wards/options');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Surgical Ward',
                'department' => [
                    'id' => $department->id,
                    'name' => 'Surgery'
                ]
            ]);
    }

    /** @test */
    public function test_catalog_options_include_category_information()
    {
        $category = \App\Models\TestCategory::factory()->create(['name' => 'Hematology']);
        TestCatalog::factory()->create([
            'name' => 'Complete Blood Count',
            'category_id' => $category->id,
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/test-catalogs/options');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Complete Blood Count',
                'category' => [
                    'id' => $category->id,
                    'name' => 'Hematology'
                ]
            ]);
    }

    /** @test */
    public function drug_formulary_options_include_stock_status()
    {
        DrugFormulary::factory()->create([
            'name' => 'Paracetamol',
            'stock_quantity' => 100,
            'reorder_level' => 50,
            'status' => 'active'
        ]);

        DrugFormulary::factory()->create([
            'name' => 'Aspirin',
            'stock_quantity' => 10,
            'reorder_level' => 50,
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/drug-formulary/options');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'generic_name',
                    'strength',
                    'form',
                    'stock_status',
                    'stock_quantity'
                ]
            ]);

        $drugs = $response->json();
        
        // Check stock status calculation
        $paracetamol = collect($drugs)->firstWhere('name', 'Paracetamol');
        $aspirin = collect($drugs)->firstWhere('name', 'Aspirin');
        
        $this->assertEquals('in_stock', $paracetamol['stock_status']);
        $this->assertEquals('low_stock', $aspirin['stock_status']);
    }

    /** @test */
    public function master_data_options_handle_large_datasets_efficiently()
    {
        // Create a large number of records to test performance
        Department::factory()->count(100)->create(['status' => 'active']);

        $startTime = microtime(true);
        
        $response = $this->actingAs($this->authenticatedUser)
            ->getJson('/api/master-data/departments/options');

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        $response->assertStatus(200)
            ->assertJsonCount(100);

        // Should complete within reasonable time (less than 1 second)
        $this->assertLessThan(1.0, $executionTime);
    }

    /** @test */
    public function master_data_options_return_consistent_structure()
    {
        Department::factory()->create(['status' => 'active']);
        Ward::factory()->create(['status' => 'active']);
        TestCatalog::factory()->create(['status' => 'active']);
        DrugFormulary::factory()->create(['status' => 'active']);

        $endpoints = [
            '/api/master-data/departments/options',
            '/api/master-data/wards/options',
            '/api/master-data/test-catalogs/options',
            '/api/master-data/drug-formulary/options'
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->actingAs($this->authenticatedUser)
                ->getJson($endpoint);

            $response->assertStatus(200);
            
            $data = $response->json();
            $this->assertIsArray($data);
            $this->assertNotEmpty($data);
            
            // Each item should have at least id and name
            foreach ($data as $item) {
                $this->assertArrayHasKey('id', $item);
                $this->assertArrayHasKey('name', $item);
            }
        }
    }
}