<?php

namespace Database\Factories;

use App\Models\MasterDataAudit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MasterDataAuditFactory extends Factory
{
    protected $model = MasterDataAudit::class;

    public function definition(): array
    {
        $entityTypes = ['Department', 'Ward', 'Bed', 'TestCatalog', 'DrugFormulary'];
        $actions = ['created', 'updated', 'deleted', 'status_changed'];

        return [
            'entity_type' => $this->faker->randomElement($entityTypes),
            'entity_id' => $this->faker->numberBetween(1, 100),
            'action' => $this->faker->randomElement($actions),
            'old_values' => $this->faker->optional()->randomElement([
                json_encode(['name' => 'Old Name', 'status' => 'active']),
                json_encode(['price' => 100.00, 'status' => 'active']),
                json_encode(['stock_quantity' => 50, 'reorder_level' => 10]),
            ]),
            'new_values' => json_encode([
                'name' => $this->faker->words(2, true),
                'status' => $this->faker->randomElement(['active', 'inactive']),
                'updated_at' => now()->toISOString(),
            ]),
            'user_id' => User::factory(),
            'created_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }

    public function forEntity(string $entityType, int $entityId): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }

    public function created(): static
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'created',
            'old_values' => null,
        ]);
    }

    public function updated(): static
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'updated',
        ]);
    }

    public function deleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'deleted',
            'new_values' => null,
        ]);
    }
}