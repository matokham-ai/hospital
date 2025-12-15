<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medication_schedules', function (Blueprint $table) {
            $table->id();

            // patient_id is a string FK (since patients.id is string)
            $table->string('patient_id');
            $table->foreign('patient_id')
                  ->references('id')
                  ->on('patients')
                  ->cascadeOnDelete();

            // Medication details
            $table->string('medication', 255);
            $table->string('dosage', 255)->nullable();
            $table->string('route', 50)->nullable();

            // Scheduling & status
            $table->time('scheduled_time');
            $table->enum('status', ['pending', 'due', 'given', 'missed'])
                  ->default('pending');

            // Admin info
            $table->foreignId('administered_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->dateTime('administered_at')->nullable();

            // Extra info
            $table->text('notes')->nullable();
            $table->string('barcode', 100)->nullable();

            $table->timestamps();

            // Indexes for better performance
            $table->index(['patient_id', 'scheduled_time']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medication_schedules');
    }
};
