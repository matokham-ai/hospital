<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\Department;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class SimpleAdminTest extends AdminTestCase
{

    protected User $adminUser;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        $permissions = [
            'access admin panel',
            'view admin dashboard',
            'view departments',
            'create departments',
            'edit departments',
            'delete departments',
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

    public function test_admin_can_access_dashboard()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_access_dashboard()
    {
        $response = $this->getJson('/admin/dashboard');

        $response->assertStatus(401);
    }

    public function test_unauthorized_user_cannot_access_dashboard()
    {
        $response = $this->actingAs($this->unauthorizedUser)
            ->getJson('/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_departments()
    {
        Department::factory()->count(3)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/departments');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_admin_can_create_department()
    {
        $departmentData = [
            'name' => 'Emergency Department',
            'code' => 'ED',
            'icon' => 'emergency',
            'description' => 'Emergency medical services',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments', $departmentData);

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

    public function test_department_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/departments', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code']);
    }

    public function test_unauthorized_user_cannot_create_department()
    {
        $departmentData = [
            'name' => 'Test Department',
            'code' => 'TEST',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->unauthorizedUser)
            ->postJson('/admin/departments', $departmentData);

        $response->assertStatus(403);
    }

    public function test_department_endpoints_require_authentication()
    {
        $response = $this->getJson('/admin/departments');
        $response->assertStatus(401);

        $response = $this->postJson('/admin/departments', []);
        $response->assertStatus(401);
    }
}