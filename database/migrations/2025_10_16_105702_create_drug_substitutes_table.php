<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
    public function up(): void
    {
        Schema::create('drug_substitutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->foreignId('substitute_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->text('substitution_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drug_substitutes');
    }
};