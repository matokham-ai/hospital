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
        Schema::create('test_catalogs', function (Blueprint $table) {
            $table->id();
            $table->string('deptid', 20)->nullable();
            $table->foreignId('category_id')->constrained('test_categories');
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->decimal('price', 10, 2);
            $table->integer('turnaround_time'); // in hours
            $table->string('unit', 50)->nullable();
            $table->string('normal_range')->nullable();
            $table->string('sample_type', 100)->nullable();
            $table->text('instructions')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('deptid')->references('deptid')->on('departments')->onDelete('set null');
            $table->index(['status', 'category_id']);
            $table->index(['name', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_catalogs');
    }
};
