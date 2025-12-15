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
        Schema::create('triage_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_patient_id')->constrained()->onDelete('cascade');
            $table->enum('triage_category', ['red', 'yellow', 'green', 'black'])->comment('Red=Critical, Yellow=Urgent, Green=Non-urgent, Black=Deceased');
            
            // Vitals
            $table->decimal('temperature', 5, 2)->nullable();
            $table->string('blood_pressure')->nullable();
            $table->integer('heart_rate')->nullable();
            $table->integer('respiratory_rate')->nullable();
            $table->integer('oxygen_saturation')->nullable();
            
            // Glasgow Coma Scale
            $table->integer('gcs_eye')->nullable()->comment('1-4');
            $table->integer('gcs_verbal')->nullable()->comment('1-5');
            $table->integer('gcs_motor')->nullable()->comment('1-6');
            $table->integer('gcs_total')->nullable()->comment('3-15');
            
            $table->text('assessment_notes')->nullable();
            $table->foreignId('assessed_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('assessed_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('triage_assessments');
    }
};
