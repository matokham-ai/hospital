<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Ward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DepartmentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $hospitalAdminUser;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        $permissions = [
            'access admin panel',
            'view departments',
            'create departments',
            'edit departments',
            'delete departments',
            'toggle department status',
            'import master data',
            'export master data',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::create(['name' => 'Admin']);
        $hospitalAdminRole = Role::create(['name' => 'Hospital Administrator']);
        $doctorRole = Role::create(['name' => 'Doctor']);

        // Assign permissions
        $adminRole->givePermissionTo($permissions);
        $hospitalAdminRole->givePermissionTo($permissions);

        // Create users
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole($adminRole);

        $this->hospitalAdminUser = User::factory()->create();
        $this->hospitalAdminUser->assignRole($hospitalAdminRole);

        $this->unauthorizedUser = User::factory()->create();
        $this->unauthorizedUser->assignRole($doctorRole);
    }

    /** @test */
    public function admin_can_view_departments_index()
    {
        Department::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/departments');

        $response->assertStatus(200)
            ->assertJsonCount(5);
    }

    /** @test */
    public function admin_can_create_department()
    {
        $departmentData = [
            'name' => 'Cardiology',
            'code' => 'CARD',
            'icon' => 'heart',
            'description' => 'Heart and cardiovascular care',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments', $departmentData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Cardiology',
                'code' => 'CARD'
            ]);

        $this->assertDatabaseHas('departments', [
            'name' => 'Cardiology',
            'code' => 'CARD'
        ]);
    }

    /** @test */
    public function admin_can_view_specific_department()
    {
        $department = Department::factory()->create([
            'name' => 'Neurology',
            'code' => 'NEURO'
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/departments/{$department->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Neurology',
                'code' => 'NEURO'
            ]);
    }

    /** @test */
    public function admin_can_update_department()
    {
        $department = Department::factory()->create([
            'name' => 'Old Name',
            'code' => 'OLD'
        ]);

        $updateData = [
            'name' => 'Updated Department',
            'code' => 'UPD',
            'description' => 'Updated description'
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/admin/departments/{$department->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Department',
                'code' => 'UPD'
            ]);

        $this->assertDatabaseHas('departments', [
            'id' => $department->id,
            'name' => 'Updated Department',
            'code' => 'UPD'
        ]);
    }

    /** @test */
    public function admin_can_delete_department_without_references()
    {
        $department = Department::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/departments/{$department->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('departments', [
            'id' => $department->id
        ]);
    }

    /** @test */
    public function admin_cannot_delete_department_with_references()
    {
        $department = Department::factory()->create();
        Ward::factory()->create(['department_id' => $department->id]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/departments/{$department->id}");

        $response->assertStatus(409)
            ->assertJsonFragment([
                'error' => 'Cannot delete department with existing references'
            ]);

        $this->assertDatabaseHas('departments', [
            'id' => $department->id
        ]);
    }

    /** @test */
    public function admin_can_toggle_department_status()
    {
        $department = Department::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/admin/departments/{$department->id}/toggle-status");

        $response->assertStatus(200);

        $this->assertDatabaseHas('departments', [
            'id' => $department->id,
            'status' => 'inactive'
        ]);
    }

    /** @test */
    public function admin_can_check_department_references()
    {
        $department = Department::factory()->create();
        Ward::factory()->count(2)->create(['department_id' => $department->id]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/departments/{$department->id}/references");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'has_references',
                'references'
            ]);
    }

    /** @test */
    public function admin_can_reorder_departments()
    {
        $departments = Department::factory()->count(3)->create();

        $reorderData = [
            'order' => [
                ['id' => $departments[2]->id, 'sort_order' => 1],
                ['id' => $departments[0]->id, 'sort_order' => 2],
                ['id' => $departments[1]->id, 'sort_order' => 3],
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments/reorder', $reorderData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('departments', [
            'id' => $departments[2]->id,
            'sort_order' => 1
        ]);
    }

    /** @test */
    public function admin_can_get_department_options()
    {
        Department::factory()->count(3)->create(['status' => 'active']);
        Department::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/departments/options/list');

        $response->assertStatus(200)
            ->assertJsonCount(3); // Only active departments
    }

    /** @test */
    public function admin_can_import_departments()
    {
        $csvData = "name,code,description\nCardiology,CARD,Heart care\nNeurology,NEURO,Brain care";
        $uploadedFile = \Illuminate\Http\UploadedFile::fake()->createWithContent('departments.csv', $csvData);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments/import/csv', [
                'file' => $uploadedFile
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_departments()
    {
        Department::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/departments/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function department_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code']);
    }

    /** @test */
    public function department_creation_validates_unique_code()
    {
        Department::factory()->create(['code' => 'CARD']);

        $departmentData = [
            'name' => 'Another Cardiology',
            'code' => 'CARD', // Duplicate code
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments', $departmentData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    /** @test */
    public function department_update_validates_unique_code_except_self()
    {
        $department1 = Department::factory()->create(['code' => 'CARD']);
        $department2 = Department::factory()->create(['code' => 'NEURO']);

        $updateData = [
            'name' => 'Updated Name',
            'code' => 'CARD' // Trying to use existing code
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/admin/departments/{$department2->id}", $updateData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    /** @test */
    public function unauthorized_user_cannot_access_department_endpoints()
    {
        $department = Department::factory()->create();

        $endpoints = [
            'GET' => [
                '/admin/departments',
                "/admin/departments/{$department->id}",
                "/admin/departments/{$department->id}/references",
                '/admin/departments/options/list'
            ],
            'POST' => [
                '/admin/departments',
                '/admin/departments/reorder'
            ],
            'PUT' => [
                "/admin/departments/{$department->id}"
            ],
            'DELETE' => [
                "/admin/departments/{$department->id}"
            ],
            'PATCH' => [
                "/admin/departments/{$department->id}/toggle-status"
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
    public function department_endpoints_require_authentication()
    {
        $response = $this->getJson('/admin/departments');
        $response->assertStatus(401);

        $response = $this->postJson('/admin/departments', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function hospital_admin_has_same_access_as_admin()
    {
        $departmentData = [
            'name' => 'Pediatrics',
            'code' => 'PED',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->hospitalAdminUser)
            ->postJson('/admin/departments', $departmentData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('departments', [
            'name' => 'Pediatrics',
            'code' => 'PED'
        ]);
    }

    /** @test */
    public function department_not_found_returns_404()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/departments/999');

        $response->assertStatus(404);
    }
}