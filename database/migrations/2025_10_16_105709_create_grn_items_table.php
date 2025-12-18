<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grn_id')->constrained('grn_purchases')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->string('batch_no', 50)->nullable();
            $table->date('expiry_date')->nullable();
            $table->integer('quantity')->default(0);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};
