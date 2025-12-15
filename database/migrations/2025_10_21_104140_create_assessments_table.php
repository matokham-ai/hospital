<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id');
            $table->unsignedBigInteger('encounter_id')->nullable();
            $table->timestamp('assessment_date');
            $table->enum('type', ['admission', 'daily', 'discharge', 'specialty', 'emergency']);
            $table->json('findings')->nullable();
            $table->json('recommendations')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->unsignedBigInteger('assessed_by');
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('encounter_id')->references('id')->on('encounters')->onDelete('cascade');
            $table->foreign('assessed_by')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['patient_id', 'assessment_date']);
            $table->index(['encounter_id', 'status']);
            $table->index(['assessment_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};