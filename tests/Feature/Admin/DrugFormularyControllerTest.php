<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Models\DrugFormulary;
use App\Models\DrugSubstitute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DrugFormularyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $hospitalAdminUser;
    protected User $pharmacistUser;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        $permissions = [
            'access admin panel',
            'view drug formulary',
            'create drug formulary',
            'edit drug formulary',
            'delete drug formulary',
            'update drug pricing',
            'manage drug stock',
            'view drug substitutes',
            'import master data',
            'export master data',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::create(['name' => 'Admin']);
        $hospitalAdminRole = Role::create(['name' => 'Hospital Administrator']);
        $pharmacistRole = Role::create(['name' => 'Pharmacist']);
        $doctorRole = Role::create(['name' => 'Doctor']);

        // Assign permissions
        $adminRole->givePermissionTo($permissions);
        $hospitalAdminRole->givePermissionTo($permissions);
        $pharmacistRole->givePermissionTo(['view drug formulary', 'view drug substitutes']);

        // Create users
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole($adminRole);

        $this->hospitalAdminUser = User::factory()->create();
        $this->hospitalAdminUser->assignRole($hospitalAdminRole);

        $this->pharmacistUser = User::factory()->create();
        $this->pharmacistUser->assignRole($pharmacistRole);

        $this->unauthorizedUser = User::factory()->create();
        $this->unauthorizedUser->assignRole($doctorRole);
    }

    /** @test */
    public function admin_can_view_drug_formulary_index()
    {
        DrugFormulary::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary');

        $response->assertStatus(200)
            ->assertJsonCount(5);
    }

    /** @test */
    public function admin_can_create_drug_formulary()
    {
        $drugData = [
            'name' => 'Paracetamol',
            'generic_name' => 'Acetaminophen',
            'atc_code' => 'N02BE01',
            'strength' => '500mg',
            'form' => 'tablet',
            'stock_quantity' => 1000,
            'reorder_level' => 100,
            'unit_price' => 2.50,
            'manufacturer' => 'Generic Pharma',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/drug-formulary', $drugData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Paracetamol',
                'atc_code' => 'N02BE01'
            ]);

        $this->assertDatabaseHas('drug_formulary', [
            'name' => 'Paracetamol',
            'atc_code' => 'N02BE01'
        ]);
    }

    /** @test */
    public function admin_can_view_specific_drug_formulary()
    {
        $drug = DrugFormulary::factory()->create([
            'name' => 'Aspirin',
            'atc_code' => 'N02BA01'
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/drug-formulary/{$drug->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Aspirin',
                'atc_code' => 'N02BA01'
            ]);
    }

    /** @test */
    public function admin_can_update_drug_formulary()
    {
        $drug = DrugFormulary::factory()->create([
            'name' => 'Old Drug Name',
            'unit_price' => 5.00
        ]);

        $updateData = [
            'name' => 'Updated Drug Name',
            'unit_price' => 7.50,
            'stock_quantity' => 500
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/admin/drug-formulary/{$drug->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Drug Name',
                'unit_price' => 7.50
            ]);

        $this->assertDatabaseHas('drug_formulary', [
            'id' => $drug->id,
            'name' => 'Updated Drug Name',
            'unit_price' => 7.50
        ]);
    }

    /** @test */
    public function admin_can_delete_drug_formulary()
    {
        $drug = DrugFormulary::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/drug-formulary/{$drug->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('drug_formulary', [
            'id' => $drug->id
        ]);
    }

    /** @test */
    public function admin_can_get_drug_forms()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/forms/list');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => ['value', 'label']
            ]);
    }

    /** @test */
    public function admin_can_update_drug_stock()
    {
        $drug = DrugFormulary::factory()->create(['stock_quantity' => 100]);

        $stockUpdateData = [
            'stock_quantity' => 250,
            'adjustment_reason' => 'Stock replenishment'
        ];

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/admin/drug-formulary/{$drug->id}/stock", $stockUpdateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('drug_formulary', [
            'id' => $drug->id,
            'stock_quantity' => 250
        ]);
    }

    /** @test */
    public function admin_can_bulk_update_drug_stock()
    {
        $drugs = DrugFormulary::factory()->count(3)->create(['stock_quantity' => 50]);

        $bulkStockData = [
            'stock_updates' => [
                [
                    'drug_id' => $drugs[0]->id,
                    'stock_quantity' => 200
                ],
                [
                    'drug_id' => $drugs[1]->id,
                    'stock_quantity' => 150
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/drug-formulary/bulk-update-stock', $bulkStockData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('drug_formulary', [
            'id' => $drugs[0]->id,
            'stock_quantity' => 200
        ]);

        $this->assertDatabaseHas('drug_formulary', [
            'id' => $drugs[1]->id,
            'stock_quantity' => 150
        ]);
    }

    /** @test */
    public function admin_can_get_low_stock_drugs()
    {
        DrugFormulary::factory()->create([
            'stock_quantity' => 5,
            'reorder_level' => 10
        ]); // Low stock

        DrugFormulary::factory()->create([
            'stock_quantity' => 50,
            'reorder_level' => 10
        ]); // Normal stock

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/low-stock/list');

        $response->assertStatus(200)
            ->assertJsonCount(1); // Only the low stock drug
    }

    /** @test */
    public function admin_can_get_drug_substitutes()
    {
        $drug = DrugFormulary::factory()->create();
        $substitute = DrugFormulary::factory()->create();
        
        DrugSubstitute::factory()->create([
            'drug_id' => $drug->id,
            'substitute_drug_id' => $substitute->id
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/drug-formulary/{$drug->id}/substitutes");

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    /** @test */
    public function admin_can_add_drug_substitute()
    {
        $drug = DrugFormulary::factory()->create();
        $substitute = DrugFormulary::factory()->create();

        $substituteData = [
            'substitute_drug_id' => $substitute->id,
            'substitution_reason' => 'Generic alternative'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson("/admin/drug-formulary/{$drug->id}/substitutes", $substituteData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('drug_substitutes', [
            'drug_id' => $drug->id,
            'substitute_drug_id' => $substitute->id
        ]);
    }

    /** @test */
    public function admin_can_remove_drug_substitute()
    {
        $drug = DrugFormulary::factory()->create();
        $substitute = DrugFormulary::factory()->create();
        
        $drugSubstitute = DrugSubstitute::factory()->create([
            'drug_id' => $drug->id,
            'substitute_drug_id' => $substitute->id
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/drug-formulary/{$drug->id}/substitutes/{$drugSubstitute->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('drug_substitutes', [
            'id' => $drugSubstitute->id
        ]);
    }

    /** @test */
    public function admin_can_get_drug_statistics()
    {
        DrugFormulary::factory()->count(10)->create(['status' => 'active']);
        DrugFormulary::factory()->count(2)->create(['status' => 'discontinued']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/statistics/data');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_drugs',
                'active_drugs',
                'discontinued_drugs',
                'low_stock_count',
                'average_price'
            ]);
    }

    /** @test */
    public function admin_can_search_drug_formulary()
    {
        DrugFormulary::factory()->create(['name' => 'Paracetamol']);
        DrugFormulary::factory()->create(['name' => 'Aspirin']);
        DrugFormulary::factory()->create(['name' => 'Ibuprofen']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/search/advanced?query=para');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    /** @test */
    public function admin_can_get_drug_formulary_options()
    {
        DrugFormulary::factory()->count(3)->create(['status' => 'active']);
        DrugFormulary::factory()->create(['status' => 'discontinued']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/options/list');

        $response->assertStatus(200)
            ->assertJsonCount(3); // Only active drugs
    }

    /** @test */
    public function admin_can_import_drug_formulary()
    {
        $csvData = "name,generic_name,atc_code,strength,form,unit_price\nParacetamol,Acetaminophen,N02BE01,500mg,tablet,2.50";
        $uploadedFile = \Illuminate\Http\UploadedFile::fake()->createWithContent('drugs.csv', $csvData);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/drug-formulary/import/csv', [
                'file' => $uploadedFile
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_drug_formulary()
    {
        DrugFormulary::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function drug_formulary_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/drug-formulary', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'generic_name', 'atc_code']);
    }

    /** @test */
    public function drug_formulary_creation_validates_atc_code_format()
    {
        $drugData = [
            'name' => 'Test Drug',
            'generic_name' => 'Test Generic',
            'atc_code' => 'INVALID', // Invalid ATC code format
            'strength' => '100mg',
            'form' => 'tablet',
            'unit_price' => 5.00
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/drug-formulary', $drugData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['atc_code']);
    }

    /** @test */
    public function drug_formulary_creation_validates_positive_values()
    {
        $drugData = [
            'name' => 'Test Drug',
            'generic_name' => 'Test Generic',
            'atc_code' => 'N02BE01',
            'strength' => '100mg',
            'form' => 'tablet',
            'stock_quantity' => -10, // Negative stock
            'unit_price' => -5.00 // Negative price
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/drug-formulary', $drugData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock_quantity', 'unit_price']);
    }

    /** @test */
    public function stock_update_validates_non_negative_quantity()
    {
        $drug = DrugFormulary::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/admin/drug-formulary/{$drug->id}/stock", [
                'stock_quantity' => -50 // Negative stock
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock_quantity']);
    }

    /** @test */
    public function pharmacist_can_view_but_not_modify_drug_formulary()
    {
        DrugFormulary::factory()->count(3)->create();

        // Can view
        $response = $this->actingAs($this->pharmacistUser)
            ->getJson('/admin/drug-formulary');

        $response->assertStatus(200);

        // Cannot create
        $response = $this->actingAs($this->pharmacistUser)
            ->postJson('/admin/drug-formulary', [
                'name' => 'New Drug',
                'generic_name' => 'Generic',
                'atc_code' => 'N02BE01'
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function unauthorized_user_cannot_access_drug_formulary_endpoints()
    {
        $drug = DrugFormulary::factory()->create();

        $endpoints = [
            'GET' => [
                '/admin/drug-formulary',
                "/admin/drug-formulary/{$drug->id}",
                '/admin/drug-formulary/forms/list'
            ],
            'POST' => [
                '/admin/drug-formulary',
                '/admin/drug-formulary/bulk-update-stock'
            ],
            'PUT' => [
                "/admin/drug-formulary/{$drug->id}"
            ],
            'DELETE' => [
                "/admin/drug-formulary/{$drug->id}"
            ]
        ];

        foreach ($endpoints as $method => $urls) {
            foreach ($urls as $url) {
                $response = $this->actingAs($this->unauthorizedUser)
                    ->json($method, $url, []);

                $response->assertStatus(403);
            }
        }
    }

    /** @test */
    public function drug_formulary_endpoints_require_authentication()
    {
        $response = $this->getJson('/admin/drug-formulary');
        $response->assertStatus(401);

        $response = $this->postJson('/admin/drug-formulary', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function hospital_admin_has_same_access_as_admin()
    {
        $drugData = [
            'name' => 'Amoxicillin',
            'generic_name' => 'Amoxicillin',
            'atc_code' => 'J01CA04',
            'strength' => '250mg',
            'form' => 'capsule',
            'unit_price' => 3.75,
            'status' => 'active'
        ];

        $response = $this->actingAs($this->hospitalAdminUser)
            ->postJson('/admin/drug-formulary', $drugData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('drug_formulary', [
            'name' => 'Amoxicillin',
            'atc_code' => 'J01CA04'
        ]);
    }

    /** @test */
    public function drug_formulary_not_found_returns_404()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/drug-formulary/999');

        $response->assertStatus(404);
    }

    /** @test */
    public function cannot_add_drug_as_substitute_to_itself()
    {
        $drug = DrugFormulary::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->postJson("/admin/drug-formulary/{$drug->id}/substitutes", [
                'substitute_drug_id' => $drug->id // Same drug as substitute
            ]);

        $response->assertStatus(422);
    }
}