<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('diagnoses', function (Blueprint $table) {
            $table->id();
            $table->integer('encounter_id');
            $table->string('icd10_code', 10);
            $table->string('description', 500);
            $table->enum('type', ['PRIMARY','SECONDARY','COMORBIDITY'])->default('PRIMARY');
            $table->string('diagnosed_by');
            $table->timestamp('diagnosed_at')->useCurrent();
            $table->timestamps();

        });
    }

    public function down(): void {
        Schema::dropIfExists('diagnoses');
    }
};
