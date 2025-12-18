<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_number', 20)->unique();
            $table->string('patient_id');
            $table->string('physician_id');
            $table->string('department_id')->nullable();
            $table->string('appointment_slot_id')->nullable();
            $table->enum('appointment_type', ['SCHEDULED','WALK_IN','EMERGENCY'])->default('SCHEDULED');
            $table->enum('status', ['SCHEDULED','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'])->default('SCHEDULED');
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->text('chief_complaint')->nullable();
            $table->text('appointment_notes')->nullable();
            $table->uuid('encounter_id')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

       
        });
    }

    public function down(): void {
        Schema::dropIfExists('appointments');
    }
};
