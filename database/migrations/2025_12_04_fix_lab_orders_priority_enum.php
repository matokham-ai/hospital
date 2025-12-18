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
            // Change priority enum to include all allowed values:
            // routine, asap, urgent, stat, critical, timed, fast, normal
            DB::statement("ALTER TABLE lab_orders MODIFY COLUMN priority ENUM('routine', 'asap', 'urgent', 'stat', 'critical', 'timed', 'fast', 'normal') DEFAULT 'routine'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            // Revert to previous enum values
            DB::statement("ALTER TABLE lab_orders MODIFY COLUMN priority ENUM('urgent', 'fast', 'normal') DEFAULT 'normal'");
        });
    }
};
