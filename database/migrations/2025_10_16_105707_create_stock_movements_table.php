<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->foreignId('source_store_id')->nullable()->constrained('pharmacy_stores')->nullOnDelete();
            $table->foreignId('dest_store_id')->nullable()->constrained('pharmacy_stores')->nullOnDelete();
            $table->enum('movement_type', ['GRN','TRANSFER','ADJUSTMENT','RETURN','RESERVATION','DISPENSING']);
            $table->integer('quantity')->default(0);
            $table->string('reference_no', 100)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
