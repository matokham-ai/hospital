<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\TestCatalog;
use App\Models\TestCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TestCatalogControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $hospitalAdminUser;
    protected User $labTechUser;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        $permissions = [
            'access admin panel',
            'view test catalogs',
            'create test catalogs',
            'edit test catalogs',
            'delete test catalogs',
            'update test pricing',
            'manage test categories',
            'import master data',
            'export master data',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::create(['name' => 'Admin']);
        $hospitalAdminRole = Role::create(['name' => 'Hospital Administrator']);
        $labTechRole = Role::create(['name' => 'Lab Technician']);
        $doctorRole = Role::create(['name' => 'Doctor']);

        // Assign permissions
        $adminRole->givePermissionTo($permissions);
        $hospitalAdminRole->givePermissionTo($permissions);
        $labTechRole->givePermissionTo(['view test catalogs']);

        // Create users
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole($adminRole);

        $this->hospitalAdminUser = User::factory()->create();
        $this->hospitalAdminUser->assignRole($hospitalAdminRole);

        $this->labTechUser = User::factory()->create();
        $this->labTechUser->assignRole($labTechRole);

        $this->unauthorizedUser = User::factory()->create();
        $this->unauthorizedUser->assignRole($doctorRole);
    }

    /** @test */
    public function admin_can_view_test_catalogs_index()
    {
        TestCatalog::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs');

        $response->assertStatus(200)
            ->assertJsonCount(5);
    }

    /** @test */
    public function admin_can_create_test_catalog()
    {
        $department = Department::factory()->create();
        $category = TestCategory::factory()->create();

        $testData = [
            'name' => 'Complete Blood Count',
            'code' => 'CBC',
            'department_id' => $department->id,
            'category_id' => $category->id,
            'price' => 150.00,
            'turnaround_time' => 24,
            'unit' => 'hours',
            'sample_type' => 'blood',
            'normal_range' => '4.5-11.0 x10^9/L',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs', $testData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Complete Blood Count',
                'code' => 'CBC'
            ]);

        $this->assertDatabaseHas('test_catalogs', [
            'name' => 'Complete Blood Count',
            'code' => 'CBC'
        ]);
    }

    /** @test */
    public function admin_can_view_specific_test_catalog()
    {
        $test = TestCatalog::factory()->create([
            'name' => 'Liver Function Test',
            'code' => 'LFT'
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/test-catalogs/{$test->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Liver Function Test',
                'code' => 'LFT'
            ]);
    }

    /** @test */
    public function admin_can_update_test_catalog()
    {
        $test = TestCatalog::factory()->create([
            'name' => 'Old Test Name',
            'price' => 100.00
        ]);

        $updateData = [
            'name' => 'Updated Test Name',
            'price' => 200.00,
            'turnaround_time' => 48
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/admin/test-catalogs/{$test->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Test Name',
                'price' => 200.00
            ]);

        $this->assertDatabaseHas('test_catalogs', [
            'id' => $test->id,
            'name' => 'Updated Test Name',
            'price' => 200.00
        ]);
    }

    /** @test */
    public function admin_can_delete_test_catalog()
    {
        $test = TestCatalog::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/test-catalogs/{$test->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('test_catalogs', [
            'id' => $test->id
        ]);
    }

    /** @test */
    public function admin_can_bulk_update_test_catalogs()
    {
        $tests = TestCatalog::factory()->count(3)->create();

        $bulkUpdateData = [
            'updates' => [
                [
                    'id' => $tests[0]->id,
                    'price' => 250.00
                ],
                [
                    'id' => $tests[1]->id,
                    'price' => 300.00
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs/bulk-update', $bulkUpdateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('test_catalogs', [
            'id' => $tests[0]->id,
            'price' => 250.00
        ]);

        $this->assertDatabaseHas('test_catalogs', [
            'id' => $tests[1]->id,
            'price' => 300.00
        ]);
    }

    /** @test */
    public function admin_can_get_test_categories()
    {
        TestCategory::factory()->count(4)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs/categories/list');

        $response->assertStatus(200)
            ->assertJsonCount(4);
    }

    /** @test */
    public function admin_can_bulk_update_test_prices()
    {
        $tests = TestCatalog::factory()->count(3)->create(['price' => 100.00]);

        $priceUpdateData = [
            'price_updates' => [
                [
                    'test_id' => $tests[0]->id,
                    'new_price' => 150.00
                ],
                [
                    'test_id' => $tests[1]->id,
                    'new_price' => 175.00
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs/bulk-update-prices', $priceUpdateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('test_catalogs', [
            'id' => $tests[0]->id,
            'price' => 150.00
        ]);
    }

    /** @test */
    public function admin_can_update_turnaround_time()
    {
        $test = TestCatalog::factory()->create(['turnaround_time' => 24]);

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/admin/test-catalogs/{$test->id}/turnaround-time", [
                'turnaround_time' => 48
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('test_catalogs', [
            'id' => $test->id,
            'turnaround_time' => 48
        ]);
    }

    /** @test */
    public function admin_can_get_test_statistics()
    {
        TestCatalog::factory()->count(10)->create(['status' => 'active']);
        TestCatalog::factory()->count(2)->create(['status' => 'inactive']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs/statistics/data');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_tests',
                'active_tests',
                'inactive_tests',
                'average_price',
                'categories_count'
            ]);
    }

    /** @test */
    public function admin_can_search_test_catalogs()
    {
        TestCatalog::factory()->create(['name' => 'Blood Sugar Test']);
        TestCatalog::factory()->create(['name' => 'Cholesterol Test']);
        TestCatalog::factory()->create(['name' => 'Kidney Function Test']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs/search/advanced?query=blood');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    /** @test */
    public function admin_can_get_test_catalog_options()
    {
        TestCatalog::factory()->count(3)->create(['status' => 'active']);
        TestCatalog::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs/options/list');

        $response->assertStatus(200)
            ->assertJsonCount(3); // Only active tests
    }

    /** @test */
    public function admin_can_import_test_catalogs()
    {
        $csvData = "name,code,price,turnaround_time\nCBC,CBC001,150,24\nLFT,LFT001,200,48";
        $uploadedFile = \Illuminate\Http\UploadedFile::fake()->createWithContent('tests.csv', $csvData);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs/import/csv', [
                'file' => $uploadedFile
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_test_catalogs()
    {
        TestCatalog::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function test_catalog_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code', 'price']);
    }

    /** @test */
    public function test_catalog_creation_validates_unique_code()
    {
        TestCatalog::factory()->create(['code' => 'CBC001']);

        $testData = [
            'name' => 'Another CBC Test',
            'code' => 'CBC001', // Duplicate code
            'price' => 150.00,
            'turnaround_time' => 24
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs', $testData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    /** @test */
    public function test_catalog_creation_validates_positive_price()
    {
        $testData = [
            'name' => 'Test Name',
            'code' => 'TEST001',
            'price' => -50.00, // Negative price
            'turnaround_time' => 24
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs', $testData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    /** @test */
    public function test_catalog_creation_validates_turnaround_time()
    {
        $testData = [
            'name' => 'Test Name',
            'code' => 'TEST001',
            'price' => 150.00,
            'turnaround_time' => -5 // Negative turnaround time
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs', $testData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['turnaround_time']);
    }

    /** @test */
    public function lab_tech_can_view_but_not_modify_test_catalogs()
    {
        TestCatalog::factory()->count(3)->create();

        // Can view
        $response = $this->actingAs($this->labTechUser)
            ->getJson('/admin/test-catalogs');

        $response->assertStatus(200);

        // Cannot create
        $response = $this->actingAs($this->labTechUser)
            ->postJson('/admin/test-catalogs', [
                'name' => 'New Test',
                'code' => 'NEW001',
                'price' => 100.00
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function unauthorized_user_cannot_access_test_catalog_endpoints()
    {
        $test = TestCatalog::factory()->create();

        $endpoints = [
            'GET' => [
                '/admin/test-catalogs',
                "/admin/test-catalogs/{$test->id}",
                '/admin/test-catalogs/categories/list'
            ],
            'POST' => [
                '/admin/test-catalogs',
                '/admin/test-catalogs/bulk-update'
            ],
            'PUT' => [
                "/admin/test-catalogs/{$test->id}"
            ],
            'DELETE' => [
                "/admin/test-catalogs/{$test->id}"
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
    public function test_catalog_endpoints_require_authentication()
    {
        $response = $this->getJson('/admin/test-catalogs');
        $response->assertStatus(401);

        $response = $this->postJson('/admin/test-catalogs', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function hospital_admin_has_same_access_as_admin()
    {
        $department = Department::factory()->create();
        $category = TestCategory::factory()->create();

        $testData = [
            'name' => 'Hemoglobin Test',
            'code' => 'HGB001',
            'department_id' => $department->id,
            'category_id' => $category->id,
            'price' => 75.00,
            'turnaround_time' => 12,
            'status' => 'active'
        ];

        $response = $this->actingAs($this->hospitalAdminUser)
            ->postJson('/admin/test-catalogs', $testData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('test_catalogs', [
            'name' => 'Hemoglobin Test',
            'code' => 'HGB001'
        ]);
    }

    /** @test */
    public function test_catalog_not_found_returns_404()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/test-catalogs/999');

        $response->assertStatus(404);
    }

    /** @test */
    public function bulk_price_update_validates_price_values()
    {
        $test = TestCatalog::factory()->create();

        $priceUpdateData = [
            'price_updates' => [
                [
                    'test_id' => $test->id,
                    'new_price' => -50.00 // Invalid negative price
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/test-catalogs/bulk-update-prices', $priceUpdateData);

        $response->assertStatus(422);
    }
}