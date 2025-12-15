<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opd_appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_number')->unique();
            $table->string('patient_id');
            $table->string('doctor_id')->nullable();
            $table->date('appointment_date');
            $table->time('appointment_time')->nullable();
            $table->enum('appointment_type', ['SCHEDULED', 'WALK_IN', 'EMERGENCY'])->default('WALK_IN');
            $table->enum('status', ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])->default('WAITING');
            $table->text('chief_complaint')->nullable();
            $table->text('notes')->nullable();
            $table->integer('queue_number')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('consultation_started_at')->nullable();
            $table->timestamp('consultation_completed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->index(['appointment_date', 'status']);
            $table->index(['status', 'queue_number']);
            $table->index(['patient_id', 'appointment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opd_appointments');
    }
};