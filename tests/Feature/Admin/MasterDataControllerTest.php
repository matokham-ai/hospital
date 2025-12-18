<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Ward;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class MasterDataControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        $permissions = [
            'access admin panel',
            'view admin dashboard',
            'bulk update master data',
            'export master data',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::create(['name' => 'Admin']);
        $doctorRole = Role::create(['name' => 'Doctor']);

        // Assign permissions
        $adminRole->givePermissionTo($permissions);

        // Create users
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole($adminRole);

        $this->unauthorizedUser = User::factory()->create();
        $this->unauthorizedUser->assignRole($doctorRole);
    }

    /** @test */
    public function admin_can_get_departments_index()
    {
        Department::factory()->count(3)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/departments');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    /** @test */
    public function admin_can_get_wards_index()
    {
        Ward::factory()->count(2)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/wards');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    /** @test */
    public function admin_can_get_test_catalogs_index()
    {
        TestCatalog::factory()->count(4)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/test-catalogs');

        $response->assertStatus(200)
            ->assertJsonCount(4);
    }

    /** @test */
    public function admin_can_get_drug_formulary_index()
    {
        DrugFormulary::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/drug-formulary');

        $response->assertStatus(200)
            ->assertJsonCount(5);
    }

    /** @test */
    public function admin_can_create_department_via_master_data_endpoint()
    {
        $departmentData = [
            'name' => 'Emergency Department',
            'code' => 'ED',
            'icon' => 'emergency',
            'description' => 'Emergency medical services',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/master-data/departments', $departmentData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Emergency Department',
                'code' => 'ED'
            ]);

        $this->assertDatabaseHas('departments', [
            'name' => 'Emergency Department',
            'code' => 'ED'
        ]);
    }

    /** @test */
    public function admin_can_update_department_via_master_data_endpoint()
    {
        $department = Department::factory()->create([
            'name' => 'Old Name',
            'code' => 'OLD'
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'code' => 'UPD'
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/admin/master-data/departments/{$department->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Name',
                'code' => 'UPD'
            ]);

        $this->assertDatabaseHas('departments', [
            'id' => $department->id,
            'name' => 'Updated Name',
            'code' => 'UPD'
        ]);
    }

    /** @test */
    public function admin_can_delete_department_via_master_data_endpoint()
    {
        $department = Department::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/master-data/departments/{$department->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('departments', [
            'id' => $department->id
        ]);
    }

    /** @test */
    public function admin_can_bulk_update_departments()
    {
        $departments = Department::factory()->count(3)->create();

        $bulkUpdateData = [
            'updates' => [
                [
                    'id' => $departments[0]->id,
                    'status' => 'inactive'
                ],
                [
                    'id' => $departments[1]->id,
                    'status' => 'inactive'
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/master-data/departments/bulk-update', $bulkUpdateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('departments', [
            'id' => $departments[0]->id,
            'status' => 'inactive'
        ]);

        $this->assertDatabaseHas('departments', [
            'id' => $departments[1]->id,
            'status' => 'inactive'
        ]);
    }

    /** @test */
    public function admin_can_export_departments()
    {
        Department::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/departments/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_wards()
    {
        Ward::factory()->count(3)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/wards/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_test_catalogs()
    {
        TestCatalog::factory()->count(4)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/test-catalogs/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_drug_formulary()
    {
        DrugFormulary::factory()->count(6)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/drug-formulary/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function unauthorized_user_cannot_access_master_data_endpoints()
    {
        $endpoints = [
            'GET' => [
                '/admin/master-data/departments',
                '/admin/master-data/wards',
                '/admin/master-data/test-catalogs',
                '/admin/master-data/drug-formulary'
            ],
            'POST' => [
                '/admin/master-data/departments',
                '/admin/master-data/departments/bulk-update'
            ]
        ];

        foreach ($endpoints['GET'] as $endpoint) {
            $response = $this->actingAs($this->unauthorizedUser)
                ->getJson($endpoint);

            $response->assertStatus(403);
        }

        foreach ($endpoints['POST'] as $endpoint) {
            $response = $this->actingAs($this->unauthorizedUser)
                ->postJson($endpoint, []);

            $response->assertStatus(403);
        }
    }

    /** @test */
    public function master_data_endpoints_require_authentication()
    {
        $response = $this->getJson('/admin/master-data/departments');
        $response->assertStatus(401);

        $response = $this->postJson('/admin/master-data/departments', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function invalid_master_data_type_returns_404()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/master-data/invalid-type');

        $response->assertStatus(404);
    }

    /** @test */
    public function bulk_update_validates_required_fields()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/master-data/departments/bulk-update', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['updates']);
    }

    /** @test */
    public function bulk_update_validates_update_structure()
    {
        $bulkUpdateData = [
            'updates' => [
                ['invalid' => 'structure']
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/master-data/departments/bulk-update', $bulkUpdateData);

        $response->assertStatus(422);
    }
}