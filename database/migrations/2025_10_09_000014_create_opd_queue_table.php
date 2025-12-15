<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('opd_queue', function (Blueprint $table) {
            $table->id();
            $table->integer('appointment_id')->nullable();
            $table->string('patient_id');
            $table->string('physician_id');
            $table->string('department_id')->nullable();
            $table->enum('queue_type', ['APPOINTMENT','WALK_IN','EMERGENCY'])->default('APPOINTMENT');
            $table->enum('status', ['WAITING','IN_PROGRESS','COMPLETED','CANCELLED'])->default('WAITING');
            $table->integer('queue_number');
            $table->enum('priority', ['LOW','NORMAL','HIGH','URGENT'])->default('NORMAL');
            $table->timestamp('queued_at')->useCurrent();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

   
        });
    }

    public function down(): void {
        Schema::dropIfExists('opd_queue');
    }
};
