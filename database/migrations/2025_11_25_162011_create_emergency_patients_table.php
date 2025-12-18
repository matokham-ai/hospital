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
        Schema::create('emergency_patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id')->nullable();
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->string('temp_name')->nullable();
            $table->string('temp_contact')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->integer('age')->nullable();
            $table->text('chief_complaint');
            $table->text('history_of_present_illness')->nullable();
            $table->enum('arrival_mode', ['ambulance', 'walk-in', 'police', 'referral'])->default('walk-in');
            $table->timestamp('arrival_time');
            $table->enum('status', ['active', 'admitted', 'discharged', 'transferred', 'deceased'])->default('active');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emergency_patients');
    }
};
