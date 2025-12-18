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
        Schema::table('prescriptions', function (Blueprint $table) {
            // Add drug_id column to link to drug_formulary table
            $table->unsignedBigInteger('drug_id')->nullable()->after('physician_id');
            
            // Add foreign key constraint
            $table->foreign('drug_id')->references('id')->on('drug_formulary')->onDelete('set null');
            
            // Add index for performance
            $table->index('drug_id', 'idx_prescriptions_drug_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Drop foreign key and index
            $table->dropForeign(['drug_id']);
            $table->dropIndex('idx_prescriptions_drug_id');
            
            // Drop column
            $table->dropColumn('drug_id');
        });
    }
};
