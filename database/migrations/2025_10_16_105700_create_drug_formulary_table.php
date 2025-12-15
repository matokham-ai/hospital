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
        Schema::create('drug_formulary', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('generic_name');
             $table->string('brand_name', 200)->nullable();
            $table->string('atc_code', 20)->nullable();
            $table->string('strength', 100);
            $table->enum('form', ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other']);
            $table->integer('stock_quantity')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->decimal('unit_price', 10, 2);
            $table->string('manufacturer')->nullable();
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['active', 'discontinued'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'stock_quantity']);
            $table->index(['name', 'generic_name']);
            $table->index(['atc_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drug_formulary');
    }
};
