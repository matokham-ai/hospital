<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opd_soap_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('opd_appointments')->onDelete('cascade');
            $table->string('patient_id');
            $table->string('doctor_id')->nullable();
            
            // SOAP Components
            $table->text('subjective')->nullable(); // Patient's complaints, symptoms
            $table->text('objective')->nullable();  // Physical examination findings
            $table->text('assessment')->nullable();  // Clinical assessment, diagnosis
            $table->text('plan')->nullable();       // Treatment plan, medications
            
            // Vital Signs
            $table->string('blood_pressure')->nullable();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->integer('pulse_rate')->nullable();
            $table->integer('respiratory_rate')->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('bmi', 4, 1)->nullable();
            $table->integer('oxygen_saturation')->nullable();
            
            // Additional Fields
            $table->text('physical_examination')->nullable();
            $table->text('investigations_ordered')->nullable();
            $table->text('medications_prescribed')->nullable();
            $table->text('follow_up_instructions')->nullable();
            $table->date('next_visit_date')->nullable();
            
            $table->boolean('is_draft')->default(true);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->index(['appointment_id', 'is_draft']);
            $table->index(['patient_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opd_soap_notes');
    }
};