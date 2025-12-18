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
        Schema::table('emergency_patients', function (Blueprint $table) {
            // Drop the old foreign key first
            $table->dropForeign(['assigned_to']);
        });
        
        Schema::table('emergency_patients', function (Blueprint $table) {
            // Change assigned_to from bigint to varchar to store physician_code
            $table->string('assigned_to', 20)->nullable()->change();
        });
        
        Schema::table('emergency_patients', function (Blueprint $table) {
            // Add new foreign key to physicians table
            $table->foreign('assigned_to')
                ->references('physician_code')
                ->on('physicians')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('emergency_patients', function (Blueprint $table) {
            // Drop the foreign key
            $table->dropForeign(['assigned_to']);
            
            // Change back to bigint
            $table->unsignedBigInteger('assigned_to')->nullable()->change();
            
            // Restore old foreign key to users table
            $table->foreign('assigned_to')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
