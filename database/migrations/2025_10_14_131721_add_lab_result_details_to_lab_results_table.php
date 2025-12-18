<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('lab_results', function (Blueprint $table) {
            $table->string('parameter_name')->after('lab_order_id');
            $table->string('value')->after('parameter_name');
              // Use safe defaults/nullable to support SQLite and existing rows
              $table->string('parameter_name')->default('')->after('lab_order_id');
              $table->string('value')->default('')->after('parameter_name');
              $table->string('unit')->nullable()->after('value');
              $table->string('reference_range')->nullable()->after('unit');
              $table->enum('status', ['pending', 'completed', 'revised'])->default('pending')->after('reference_range');
              $table->text('description')->nullable()->after('status');
        });
    }

    public function down()
    {
        Schema::table('lab_results', function (Blueprint $table) {
            $table->dropColumn(['parameter_name', 'value', 'unit', 'reference_range', 'status', 'description']);
        });
    }
};
