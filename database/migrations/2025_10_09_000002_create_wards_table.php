<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('wards', function (Blueprint $table) {
            $table->string('wardid',20)->primary();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->uuid('department_id')->nullable();
            $table->enum('ward_type', ['GENERAL','ICU','MATERNITY','PEDIATRIC','ISOLATION','PRIVATE']);
            $table->integer('total_beds')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            
        });
    }

    public function down(): void {
        Schema::dropIfExists('wards');
    }
};
