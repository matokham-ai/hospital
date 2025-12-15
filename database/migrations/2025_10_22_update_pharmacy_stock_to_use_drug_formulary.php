<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacy_stock', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['drug_id']);
            
            // Update the foreign key to reference drug_formulary
            $table->foreign('drug_id')->references('id')->on('drug_formulary')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // No need to do anything - the original table already used drug_formulary
        // This migration was redundant but we keep it for migration history
    }
};