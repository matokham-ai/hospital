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
            // Change duration from int to varchar to store "7 days", "2 weeks", etc.
            $table->string('duration')->nullable()->change();
            
            // Change quantity from int to varchar to store "14 tablets", "1 bottle", etc.
            $table->string('quantity')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Revert back to int (this might cause data loss)
            $table->integer('duration')->nullable()->change();
            $table->integer('quantity')->nullable()->change();
        });
    }
};