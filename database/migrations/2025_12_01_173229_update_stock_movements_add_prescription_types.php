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
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN movement_type ENUM('GRN','TRANSFER','ADJUSTMENT','RETURN','RESERVATION','DISPENSING') NOT NULL");
        } else {
            // For SQLite, we need to recreate the table
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropColumn('movement_type');
            });
            
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->enum('movement_type', ['GRN','TRANSFER','ADJUSTMENT','RETURN','RESERVATION','DISPENSING'])->after('dest_store_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN movement_type ENUM('GRN','TRANSFER','ADJUSTMENT','RETURN') NOT NULL");
        } else {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropColumn('movement_type');
            });
            
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->enum('movement_type', ['GRN','TRANSFER','ADJUSTMENT','RETURN'])->after('dest_store_id');
            });
        }
    }
};
