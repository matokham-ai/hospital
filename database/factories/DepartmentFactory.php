<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition(): array
    {
        $departments = [
            ['name' => 'Cardiology', 'code' => 'CARD'],
            ['name' => 'Pediatrics', 'code' => 'PED'],
            ['name' => 'Orthopedics', 'code' => 'ORTH'],
            ['name' => 'General Medicine', 'code' => 'GEN'],
            ['name' => 'Emergency', 'code' => 'EMER'],
            ['name' => 'Surgery', 'code' => 'SURG'],
            ['name' => 'Radiology', 'code' => 'RAD'],
            ['name' => 'Laboratory', 'code' => 'LAB']
        ];
        
        $dept = $this->faker->randomElement($departments);
        $uniqueSuffix = $this->faker->unique()->numberBetween(1, 9999);
        
        return [
            'deptid' => $dept['code'] . str_pad($uniqueSuffix, 2, '0', STR_PAD_LEFT),
            'name' => $dept['name'],
            'code' => $dept['code'] . $uniqueSuffix,
            'description' => $this->faker->sentence(),
            'status' => 'active',
        ];
    }
}