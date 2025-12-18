<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            // Change priority from nullable string to enum with default value
            // First, update any null values to 'normal'
            DB::statement("UPDATE lab_orders SET priority = 'normal' WHERE priority IS NULL OR priority = ''");
            
            // Drop the existing priority column
            $table->dropColumn('priority');
        });

        Schema::table('lab_orders', function (Blueprint $table) {
            // Add test_id to link to test catalog
            $table->unsignedBigInteger('test_id')->nullable()->after('test_name');
            
            // Add priority as enum with specific values
            $table->enum('priority', ['urgent', 'fast', 'normal'])->default('normal')->after('status');
            
            // Add expected completion timestamp
            $table->timestamp('expected_completion_at')->nullable()->after('priority');
            
            // Add clinical notes field
            $table->text('clinical_notes')->nullable()->after('expected_completion_at');
            
            // Add foreign key constraint
            $table->foreign('test_id')->references('id')->on('test_catalogs')->onDelete('set null');
        });

        // Add indexes for performance optimization
        Schema::table('lab_orders', function (Blueprint $table) {
            $table->index('encounter_id', 'idx_lab_orders_encounter');
            $table->index('priority', 'idx_lab_orders_priority');
            $table->index(['status', 'priority'], 'idx_lab_orders_status_priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_lab_orders_encounter');
            $table->dropIndex('idx_lab_orders_priority');
            $table->dropIndex('idx_lab_orders_status_priority');
        });

        Schema::table('lab_orders', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['test_id']);
            
            // Drop the enum priority column
            $table->dropColumn('priority');
            
            // Drop new columns
            $table->dropColumn(['test_id', 'expected_completion_at', 'clinical_notes']);
        });

        Schema::table('lab_orders', function (Blueprint $table) {
            // Restore original priority column as nullable string
            $table->string('priority')->nullable()->after('status');
        });
    }
};
