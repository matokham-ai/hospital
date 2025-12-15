<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\TestCatalog;
use App\Models\DrugFormulary;
use App\Models\MasterDataAudit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdminControllerTest extends TestCase
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
            'view admin dashboard',
            'view audit logs',
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
    public function authenticated_admin_can_access_dashboard()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/dashboard');

        $response->assertStatus(200);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_dashboard()
    {
        $response = $this->getJson('/admin/dashboard');

        $response->assertStatus(401);
    }

    /** @test */
    public function unauthorized_user_cannot_access_dashboard()
    {
        $response = $this->actingAs($this->unauthorizedUser)
            ->getJson('/admin/dashboard');

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_get_master_data_stats()
    {
        // Create test data
        Department::factory()->count(3)->create();
        Ward::factory()->count(2)->create();
        Bed::factory()->count(5)->create();
        TestCatalog::factory()->count(4)->create();
        DrugFormulary::factory()->count(6)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'departments',
                'wards',
                'beds',
                'tests',
                'drugs'
            ])
            ->assertJson([
                'departments' => 3,
                'wards' => 2,
                'beds' => 5,
                'tests' => 4,
                'drugs' => 6
            ]);
    }

    /** @test */
    public function admin_can_get_recent_activity()
    {
        // Create audit entries
        MasterDataAudit::factory()->count(5)->create([
            'user_id' => $this->adminUser->id
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/dashboard/activity');

        $response->assertStatus(200)
            ->assertJsonCount(5);
    }

    /** @test */
    public function admin_can_get_navigation_state()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/navigation-state');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_section',
                'available_sections',
                'permissions'
            ]);
    }

    /** @test */
    public function admin_can_access_audit_log()
    {
        MasterDataAudit::factory()->count(10)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/audit');

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_get_audit_stats()
    {
        MasterDataAudit::factory()->count(15)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/audit/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_changes',
                'changes_today',
                'changes_this_week',
                'changes_this_month'
            ]);
    }

    /** @test */
    public function admin_can_export_audit_data()
    {
        MasterDataAudit::factory()->count(5)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/audit/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_get_entity_audit_history()
    {
        $department = Department::factory()->create();
        MasterDataAudit::factory()->count(3)->create([
            'entity_type' => 'Department',
            'entity_id' => $department->id
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/audit/entity/Department/{$department->id}/history");

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    /** @test */
    public function admin_can_get_user_activity_summary()
    {
        MasterDataAudit::factory()->count(7)->create([
            'user_id' => $this->adminUser->id
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/audit/user/{$this->adminUser->id}/summary");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_changes',
                'entities_modified',
                'recent_activity'
            ]);
    }

    /** @test */
    public function unauthorized_user_cannot_access_audit_endpoints()
    {
        $endpoints = [
            '/admin/audit',
            '/admin/audit/stats',
            '/admin/audit/export',
            '/admin/audit/entity/Department/1/history',
            '/admin/audit/user/1/summary'
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->actingAs($this->unauthorizedUser)
                ->getJson($endpoint);

            $response->assertStatus(403);
        }
    }

    /** @test */
    public function hospital_admin_has_same_access_as_admin()
    {
        $response = $this->actingAs($this->hospitalAdminUser)
            ->getJson('/admin/dashboard');

        $response->assertStatus(200);

        $response = $this->actingAs($this->hospitalAdminUser)
            ->getJson('/admin/dashboard/stats');

        $response->assertStatus(200);
    }
}