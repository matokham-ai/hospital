<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('encounters', function (Blueprint $table) {
            if (!Schema::hasColumn('encounters', 'icd10_code')) {
                $table->string('icd10_code', 20)->nullable()->after('chief_complaint');
            }
        });
    }

    public function down(): void
    {
        Schema::table('encounters', function (Blueprint $table) {
            if (Schema::hasColumn('encounters', 'icd10_code')) {
                $table->dropColumn('icd10_code');
            }
        });
    }
};
