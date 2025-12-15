<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medication_administrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->onDelete('cascade');
            $table->foreignId('encounter_id')->constrained()->onDelete('cascade');
            $table->string('patient_id');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->dateTime('scheduled_time');
            $table->dateTime('administered_at')->nullable();
            $table->foreignId('administered_by')->nullable()->constrained('users');
            $table->enum('status', ['due', 'given', 'missed', 'skipped'])->default('due');
            $table->text('notes')->nullable();
            $table->string('dosage_given')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medication_administrations');
    }
};
