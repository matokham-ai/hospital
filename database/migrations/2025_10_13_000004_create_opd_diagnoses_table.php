<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opd_diagnoses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('opd_appointments')->onDelete('cascade');
            $table->foreignId('soap_note_id')->nullable()->constrained('opd_soap_notes')->onDelete('cascade');
            $table->string('patient_id');
            $table->string('icd10_code', 10);
            $table->string('description');
            $table->enum('type', ['PRIMARY', 'SECONDARY', 'COMORBIDITY'])->default('PRIMARY');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('icd10_code')->references('code')->on('icd10_codes');
            $table->index(['appointment_id', 'type']);
            $table->index(['patient_id', 'is_active']);
            $table->index(['icd10_code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opd_diagnoses');
    }
};