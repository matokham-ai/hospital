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
        Schema::table('beds', function (Blueprint $table) {
            // Add new columns for admin system
            $table->timestamp('last_occupied_at')->nullable()->after('status');
            $table->text('maintenance_notes')->nullable()->after('last_occupied_at');
            
            // Update status enum to match design
            $table->dropColumn('status');
        });
        
        Schema::table('beds', function (Blueprint $table) {
            $table->enum('status', ['available', 'occupied', 'maintenance', 'reserved', 'out_of_order'])->default('available')->after('bed_type');
            
            // Add foreign key constraint to wards
            $table->foreign('ward_id')->references('wardid')->on('wards')->onDelete('cascade');
            
            // Add indexes for performance
            $table->index(['status', 'bed_type']);
            $table->index('ward_id');
        });

        // Update existing is_active logic - beds without is_active = false should be available
        DB::statement("UPDATE beds SET status = CASE WHEN is_active = 0 THEN 'out_of_order' ELSE 'available' END");
        
        Schema::table('beds', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('beds', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
            $table->dropForeign(['ward_id']);
            $table->dropIndex(['status', 'bed_type']);
            $table->dropIndex(['ward_id']);
            $table->dropColumn(['last_occupied_at', 'maintenance_notes']);
            
            // Restore original status enum
            $table->dropColumn('status');
        });
        
        Schema::table('beds', function (Blueprint $table) {
            $table->enum('status', ['AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED'])->default('AVAILABLE');
        });
    }
};
