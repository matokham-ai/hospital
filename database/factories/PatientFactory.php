<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'id' => 'P' . str_pad($this->faker->unique()->numberBetween(1, 999999), 6, '0', STR_PAD_LEFT),
            'hospital_id' => $this->faker->unique()->numerify('H######'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'middle_name' => $this->faker->optional(0.3)->firstName(),
            'date_of_birth' => $this->faker->dateTimeBetween('-80 years', '-1 year'),
            'gender' => $this->faker->randomElement(['M', 'F', 'O']),
            'marital_status' => $this->faker->randomElement(['Single', 'Married', 'Divorced', 'Widowed']),
            'occupation' => $this->faker->optional(0.8)->jobTitle(),
            'nationality' => $this->faker->country(),
            'religion' => $this->faker->optional(0.7)->randomElement(['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Other']),
            'insurance_info' => $this->faker->optional(0.6)->randomElement([
                ['provider' => 'NHIS', 'policy_number' => $this->faker->numerify('NHIS-########')],
                ['provider' => 'Private Insurance', 'policy_number' => $this->faker->numerify('PI-########')],
                null
            ]),
            'allergies' => $this->faker->boolean(30) ? $this->faker->randomElements([
                'Penicillin', 'Aspirin', 'Peanuts', 'Shellfish', 'Latex', 'Dust'
            ], $this->faker->numberBetween(1, 3)) : [],
            'chronic_conditions' => $this->faker->boolean(40) ? $this->faker->randomElements([
                'Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Arthritis'
            ], $this->faker->numberBetween(1, 2)) : [],
            'alerts' => $this->faker->boolean(20) ? $this->faker->randomElements([
                'High Risk Patient', 'Drug Allergy', 'Fall Risk', 'Infection Control'
            ], $this->faker->numberBetween(1, 2)) : [],
        ];
    }

    /**
     * Indicate that the patient is male.
     */
    public function male(): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => 'M',
        ]);
    }

    /**
     * Indicate that the patient is female.
     */
    public function female(): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => 'F',
        ]);
    }

    /**
     * Indicate that the patient has allergies.
     */
    public function withAllergies(): static
    {
        return $this->state(fn (array $attributes) => [
            'allergies' => ['Penicillin', 'Aspirin'],
        ]);
    }

    /**
     * Indicate that the patient has chronic conditions.
     */
    public function withChronicConditions(): static
    {
        return $this->state(fn (array $attributes) => [
            'chronic_conditions' => ['Hypertension', 'Diabetes'],
        ]);
    }

    /**
     * Indicate that the patient has insurance.
     */
    public function withInsurance(): static
    {
        return $this->state(fn (array $attributes) => [
            'insurance_info' => [
                'provider' => 'NHIS',
                'policy_number' => $this->faker->numerify('NHIS-########')
            ],
        ]);
    }
}