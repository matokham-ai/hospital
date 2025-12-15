<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('round_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->constrained('doctor_rounds')->onDelete('cascade');
            $table->text('note');
            $table->enum('type', ['observation', 'assessment', 'plan', 'medication', 'vital_signs', 'general'])->default('general');
            $table->foreignId('created_by');
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['round_id', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('round_notes');
    }
};