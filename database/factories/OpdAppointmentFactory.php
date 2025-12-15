<?php

namespace Database\Factories;

use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class OpdAppointmentFactory extends Factory
{
    protected $model = OpdAppointment::class;

    public function definition(): array
    {
        $appointmentDate = $this->faker->dateTimeBetween('-30 days', '+30 days');
        $appointmentTime = $this->faker->time('H:i');
        
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => User::factory(),
            'appointment_date' => $appointmentDate,
            'appointment_time' => $appointmentTime,
            'appointment_type' => $this->faker->randomElement(['SCHEDULED', 'WALK_IN', 'EMERGENCY']),
            'status' => $this->faker->randomElement(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
            'chief_complaint' => $this->faker->optional(0.8)->sentence(),
            'notes' => $this->faker->optional(0.5)->paragraph(),
            'queue_number' => $this->faker->numberBetween(1, 50),
            'checked_in_at' => null,
            'consultation_started_at' => null,
            'consultation_completed_at' => null,
        ];
    }

    /**
     * Indicate that the appointment is scheduled.
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'appointment_type' => 'SCHEDULED',
            'status' => 'WAITING',
            'checked_in_at' => null,
            'consultation_started_at' => null,
            'consultation_completed_at' => null,
        ]);
    }

    /**
     * Indicate that the patient has checked in.
     */
    public function checkedIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'WAITING',
            'checked_in_at' => $this->faker->dateTimeBetween('-2 hours', 'now'),
        ]);
    }

    /**
     * Indicate that the appointment is in progress.
     */
    public function inProgress(): static
    {
        $checkedInAt = $this->faker->dateTimeBetween('-3 hours', '-1 hour');
        $consultationStartedAt = $this->faker->dateTimeBetween($checkedInAt, 'now');

        return $this->state(fn (array $attributes) => [
            'status' => 'IN_PROGRESS',
            'checked_in_at' => $checkedInAt,
            'consultation_started_at' => $consultationStartedAt,
        ]);
    }

    /**
     * Indicate that the appointment is completed.
     */
    public function completed(): static
    {
        $checkedInAt = $this->faker->dateTimeBetween('-4 hours', '-2 hours');
        $consultationStartedAt = $this->faker->dateTimeBetween($checkedInAt, '-1 hour');
        $consultationCompletedAt = $this->faker->dateTimeBetween($consultationStartedAt, 'now');

        return $this->state(fn (array $attributes) => [
            'status' => 'COMPLETED',
            'checked_in_at' => $checkedInAt,
            'consultation_started_at' => $consultationStartedAt,
            'consultation_completed_at' => $consultationCompletedAt,
        ]);
    }

    /**
     * Indicate that the appointment is for today.
     */
    public function today(): static
    {
        return $this->state(fn (array $attributes) => [
            'appointment_date' => today(),
        ]);
    }

    /**
     * Indicate that the appointment is a walk-in.
     */
    public function walkIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'appointment_type' => 'WALK_IN',
            'appointment_date' => today(),
            'status' => 'WAITING',
        ]);
    }

    /**
     * Indicate that the appointment is an emergency.
     */
    public function emergency(): static
    {
        return $this->state(fn (array $attributes) => [
            'appointment_type' => 'EMERGENCY',
            'status' => 'WAITING',
            'chief_complaint' => 'Emergency consultation required',
        ]);
    }
}