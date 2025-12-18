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
        Schema::table('lab_orders', function (Blueprint $table) {
            // Make ordered_by nullable to handle cases where we can't determine the ordering physician
            $table->string('ordered_by')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            // Revert to NOT NULL
            $table->string('ordered_by')->nullable(false)->change();
        });
    }
};
