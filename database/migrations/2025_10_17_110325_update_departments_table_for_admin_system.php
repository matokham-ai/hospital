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
        Schema::table('departments', function (Blueprint $table) {
            // Add new columns for admin system
            $table->string('icon', 50)->default('building')->after('description');
            $table->integer('sort_order')->default(0)->after('icon');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('sort_order');
            
            // Add indexes for performance
            $table->index(['status', 'sort_order']);
            $table->index('name');
        });

        // Update existing is_active to status enum
        DB::statement("UPDATE departments SET status = CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END");
        
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
            $table->dropIndex(['status', 'sort_order']);
            $table->dropIndex(['name']);
            $table->dropColumn(['icon', 'sort_order', 'status']);
        });
    }
};
