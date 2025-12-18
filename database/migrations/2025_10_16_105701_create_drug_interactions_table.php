<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('drug_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_a_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->foreignId('drug_b_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->enum('severity', ['minor', 'moderate', 'major'])->default('minor');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drug_interactions');
    }
};
