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
            // Add instant dispensing flag
            $table->boolean('instant_dispensing')->default(false)->after('status');
            
            // Add stock reservation tracking
            $table->boolean('stock_reserved')->default(false)->after('instant_dispensing');
            $table->timestamp('stock_reserved_at')->nullable()->after('stock_reserved');
        });

        // Add indexes for performance optimization
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->index('encounter_id', 'idx_prescriptions_encounter');
            $table->index('instant_dispensing', 'idx_prescriptions_instant');
            $table->index(['stock_reserved', 'stock_reserved_at'], 'idx_prescriptions_stock_reserved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_prescriptions_encounter');
            $table->dropIndex('idx_prescriptions_instant');
            $table->dropIndex('idx_prescriptions_stock_reserved');
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            // Drop columns
            $table->dropColumn(['instant_dispensing', 'stock_reserved', 'stock_reserved_at']);
        });
    }
};
