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
        Schema::table('wards', function (Blueprint $table) {
            // Add new columns for admin system
            $table->integer('floor_number')->nullable()->after('total_beds');
            $table->text('description')->nullable()->after('floor_number');
            $table->enum('status', ['active', 'inactive', 'maintenance', 'renovation'])->default('active')->after('description');
            
            // Add foreign key constraint to departments
            $table->foreign('department_id')->references('deptid')->on('departments')->onDelete('set null');
            
            // Add indexes for performance
            $table->index(['status', 'ward_type']);
            $table->index('name');
        });

        // Update existing is_active to status enum
        DB::statement("UPDATE wards SET status = CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END");
        
        Schema::table('wards', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wards', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
            $table->dropForeign(['department_id']);
            $table->dropIndex(['status', 'ward_type']);
            $table->dropIndex(['name']);
            $table->dropColumn(['floor_number', 'description', 'status']);
        });
    }
};
