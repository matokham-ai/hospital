<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Ward;
use App\Models\Bed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class WardControllerTest extends TestCase
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
            'view wards',
            'create wards',
            'edit wards',
            'delete wards',
            'view beds',
            'create beds',
            'edit beds',
            'update bed status',
            'view bed occupancy',
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
    public function admin_can_view_wards_index()
    {
        Ward::factory()->count(3)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/wards');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    /** @test */
    public function admin_can_get_wards_with_beds()
    {
        $ward = Ward::factory()->create();
        Bed::factory()->count(5)->create(['ward_id' => $ward->id]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/wards/matrix/data');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'type',
                    'capacity',
                    'occupancy_rate',
                    'available_beds',
                    'beds'
                ]
            ]);
    }

    /** @test */
    public function admin_can_get_occupancy_matrix()
    {
        $ward = Ward::factory()->create();
        Bed::factory()->count(3)->create([
            'ward_id' => $ward->id,
            'status' => 'available'
        ]);
        Bed::factory()->count(2)->create([
            'ward_id' => $ward->id,
            'status' => 'occupied'
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/wards/occupancy/matrix');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'ward_id',
                    'ward_name',
                    'ward_type',
                    'capacity',
                    'occupancy_rate',
                    'beds' => [
                        '*' => [
                            'id',
                            'bed_number',
                            'bed_type',
                            'status'
                        ]
                    ]
                ]
            ]);
    }

    /** @test */
    public function admin_can_create_ward()
    {
        $department = Department::factory()->create();

        $wardData = [
            'name' => 'ICU Ward',
            'type' => 'icu',
            'department_id' => $department->id,
            'capacity' => 20,
            'floor_number' => 3,
            'description' => 'Intensive Care Unit',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/wards', $wardData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'ICU Ward',
                'type' => 'icu'
            ]);

        $this->assertDatabaseHas('wards', [
            'name' => 'ICU Ward',
            'type' => 'icu'
        ]);
    }

    /** @test */
    public function admin_can_view_specific_ward()
    {
        $ward = Ward::factory()->create(['name' => 'General Ward']);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/wards/{$ward->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'General Ward'
            ])
            ->assertJsonStructure([
                'id',
                'name',
                'type',
                'occupancy_rate',
                'available_beds_count'
            ]);
    }

    /** @test */
    public function admin_can_update_ward()
    {
        $ward = Ward::factory()->create(['name' => 'Old Ward Name']);

        $updateData = [
            'name' => 'Updated Ward Name',
            'capacity' => 25
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/admin/wards/{$ward->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Ward Name'
            ]);

        $this->assertDatabaseHas('wards', [
            'id' => $ward->id,
            'name' => 'Updated Ward Name'
        ]);
    }

    /** @test */
    public function admin_can_delete_ward_without_beds()
    {
        $ward = Ward::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/wards/{$ward->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('wards', [
            'id' => $ward->id
        ]);
    }

    /** @test */
    public function admin_cannot_delete_ward_with_beds()
    {
        $ward = Ward::factory()->create();
        Bed::factory()->create(['ward_id' => $ward->id]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/admin/wards/{$ward->id}");

        $response->assertStatus(409)
            ->assertJsonFragment([
                'error' => 'Cannot delete ward with existing beds'
            ]);

        $this->assertDatabaseHas('wards', [
            'id' => $ward->id
        ]);
    }

    /** @test */
    public function admin_can_update_bed_status()
    {
        $bed = Bed::factory()->create(['status' => 'available']);

        $updateData = [
            'status' => 'occupied',
            'maintenance_notes' => 'Patient admitted'
        ];

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/admin/beds/{$bed->id}/status", $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('beds', [
            'id' => $bed->id,
            'status' => 'occupied'
        ]);
    }

    /** @test */
    public function admin_can_bulk_update_beds()
    {
        $beds = Bed::factory()->count(3)->create(['status' => 'available']);

        $bulkUpdateData = [
            'bed_updates' => [
                [
                    'bed_id' => $beds[0]->id,
                    'status' => 'occupied'
                ],
                [
                    'bed_id' => $beds[1]->id,
                    'status' => 'maintenance'
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/beds/bulk-update', $bulkUpdateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('beds', [
            'id' => $beds[0]->id,
            'status' => 'occupied'
        ]);

        $this->assertDatabaseHas('beds', [
            'id' => $beds[1]->id,
            'status' => 'maintenance'
        ]);
    }

    /** @test */
    public function admin_can_create_beds_for_ward()
    {
        $ward = Ward::factory()->create(['name' => 'Test Ward']);

        $bedCreationData = [
            'bed_count' => 5,
            'bed_type' => 'standard',
            'bed_number_prefix' => 'TW'
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson("/admin/wards/{$ward->id}/beds/create", $bedCreationData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'beds_created' => 5
            ]);

        $this->assertDatabaseCount('beds', 5);
        $this->assertDatabaseHas('beds', [
            'ward_id' => $ward->id,
            'bed_number' => 'TW-01'
        ]);
    }

    /** @test */
    public function admin_can_get_ward_occupancy_stats()
    {
        $ward = Ward::factory()->create();
        Bed::factory()->count(3)->create([
            'ward_id' => $ward->id,
            'status' => 'available'
        ]);
        Bed::factory()->count(2)->create([
            'ward_id' => $ward->id,
            'status' => 'occupied'
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson("/admin/wards/{$ward->id}/occupancy/stats");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_beds',
                'occupied_beds',
                'available_beds',
                'maintenance_beds',
                'reserved_beds',
                'occupancy_rate'
            ])
            ->assertJson([
                'total_beds' => 5,
                'occupied_beds' => 2,
                'available_beds' => 3
            ]);
    }

    /** @test */
    public function admin_can_get_ward_options()
    {
        Ward::factory()->count(3)->create(['status' => 'active']);
        Ward::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/wards/options/list');

        $response->assertStatus(200)
            ->assertJsonCount(3); // Only active wards
    }

    /** @test */
    public function admin_can_export_wards()
    {
        Ward::factory()->count(4)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/wards/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_export_beds()
    {
        Bed::factory()->count(6)->create();

        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/beds/export');

        $response->assertStatus(200);
    }

    /** @test */
    public function ward_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/admin/wards', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'type', 'department_id']);
    }

    /** @test */
    public function bed_status_update_validates_status_values()
    {
        $bed = Bed::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/admin/beds/{$bed->id}/status", [
                'status' => 'invalid_status'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function bed_creation_validates_bed_count_limits()
    {
        $ward = Ward::factory()->create();

        $response = $this->actingAs($this->adminUser)
            ->postJson("/admin/wards/{$ward->id}/beds/create", [
                'bed_count' => 150, // Exceeds max limit
                'bed_type' => 'standard'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bed_count']);
    }

    /** @test */
    public function unauthorized_user_cannot_access_ward_endpoints()
    {
        $ward = Ward::factory()->create();
        $bed = Bed::factory()->create();

        $endpoints = [
            'GET' => [
                '/admin/wards',
                "/admin/wards/{$ward->id}",
                '/admin/wards/matrix/data',
                '/admin/wards/occupancy/matrix'
            ],
            'POST' => [
                '/admin/wards',
                '/admin/beds/bulk-update'
            ],
            'PATCH' => [
                "/admin/beds/{$bed->id}/status"
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
    public function ward_endpoints_require_authentication()
    {
        $response = $this->getJson('/admin/wards');
        $response->assertStatus(401);

        $response = $this->postJson('/admin/wards', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function hospital_admin_has_same_access_as_admin()
    {
        $department = Department::factory()->create();

        $wardData = [
            'name' => 'Maternity Ward',
            'type' => 'maternity',
            'department_id' => $department->id,
            'capacity' => 15,
            'status' => 'active'
        ];

        $response = $this->actingAs($this->hospitalAdminUser)
            ->postJson('/admin/wards', $wardData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('wards', [
            'name' => 'Maternity Ward',
            'type' => 'maternity'
        ]);
    }

    /** @test */
    public function ward_not_found_returns_404()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/admin/wards/999');

        $response->assertStatus(404);
    }

    /** @test */
    public function bed_not_found_returns_404()
    {
        $response = $this->actingAs($this->adminUser)
            ->patchJson('/admin/beds/999/status', ['status' => 'occupied']);

        $response->assertStatus(404);
    }
}