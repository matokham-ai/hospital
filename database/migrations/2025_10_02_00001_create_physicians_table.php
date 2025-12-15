<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void {
        Schema::create('physicians', function (Blueprint $table) {
            $table->string('physician_code', 20)->primary(); // Human-readable ID e.g. PHY0001
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete(); // FK to users
            $table->string('name', 100);
            $table->string('license_number', 50)->unique(); // Medical license
            $table->string('specialization', 100)->nullable(); // e.g., Cardiology
            $table->string('qualification', 100)->nullable();  // e.g., MD, MBChB
            $table->string('medical_school', 150)->nullable();
            $table->integer('years_of_experience')->nullable();
            $table->boolean('is_consultant')->default(false);
            $table->text('bio')->nullable(); // Short profile/summary
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('physicians');
    }
};
