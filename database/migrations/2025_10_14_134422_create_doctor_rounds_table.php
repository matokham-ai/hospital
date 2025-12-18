<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('doctor_rounds', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id');
            $table->foreignId('doctor_id');
            $table->date('round_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'late'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('assessment')->nullable();
            $table->text('plan')->nullable();
            $table->json('vital_signs')->nullable();
            $table->string('electronic_signature')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['doctor_id', 'round_date']);
            $table->index(['patient_id', 'round_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('doctor_rounds');
    }
};