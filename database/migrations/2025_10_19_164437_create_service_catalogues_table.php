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
        Schema::create('service_catalogues', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->string('unit_of_measure')->nullable();
            $table->string('department_id', 20)->nullable();
            $table->foreign('department_id')->references('deptid')->on('departments')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_billable')->default(true);
            $table->decimal('tax_rate', 5, 2)->nullable();
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index(['is_active', 'is_billable']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_catalogues');
    }
};
