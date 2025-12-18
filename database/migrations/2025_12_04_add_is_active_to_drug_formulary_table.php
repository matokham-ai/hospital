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
        Schema::table('drug_formulary', function (Blueprint $table) {
            // Add is_active column if it doesn't exist
            if (!Schema::hasColumn('drug_formulary', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('status')
                    ->comment('Whether the drug is active or inactive');
                $table->index('is_active');
            }
        });

        // Migrate existing status values to is_active
        DB::statement("UPDATE drug_formulary SET is_active = 1 WHERE status = 'active'");
        DB::statement("UPDATE drug_formulary SET is_active = 0 WHERE status = 'discontinued'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drug_formulary', function (Blueprint $table) {
            if (Schema::hasColumn('drug_formulary', 'is_active')) {
                $table->dropIndex(['is_active']);
                $table->dropColumn('is_active');
            }
        });
    }
};
