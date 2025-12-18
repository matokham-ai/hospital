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
        if (!Schema::hasTable('drug_substitutes')) {
            Schema::create('drug_substitutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_id')->constrained('drug_formulary')->onDelete('cascade');
            $table->foreignId('substitute_drug_id')->constrained('drug_formulary')->onDelete('cascade');
            $table->enum('substitution_type', ['generic', 'therapeutic', 'brand']);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['drug_id', 'substitute_drug_id']);
            $table->index(['drug_id', 'substitution_type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drug_substitutes');
    }
};
