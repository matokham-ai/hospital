<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('encounters', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id');
            $table->string('encounter_number', 20)->unique();
            $table->enum('type', ['OPD','IPD','EMERGENCY']);
            $table->enum('status', ['ACTIVE','COMPLETED','CANCELLED'])->default('ACTIVE');
            $table->string('department_id')->nullable();
            $table->string('attending_physician_id')->nullable();
            $table->text('chief_complaint')->nullable();
            $table->enum('priority',['NORMAL','CRITICAL','URGENT','LOW'])->default('NORMAL');      
            $table->enum('severity',['CRITICAL','HIGH','MEDIUM','MINOR'])->nullable();      
            $table->enum('acuity_level',['CRITICAL','HIGH','NORMAL','LOW'])->nullable(); 
            $table->string('discharge_summary')->nullable();
            $table->string('discharge_condition')->nullable();
            $table->string('admission_notes')->nullable();     
            $table->timestamp('admission_datetime')->useCurrent();
            $table->timestamp('discharge_datetime')->nullable();
            $table->timestamps();
            $table->softDeletes();

      
        });
    }

    public function down(): void {
        Schema::dropIfExists('encounters');
    }
};
