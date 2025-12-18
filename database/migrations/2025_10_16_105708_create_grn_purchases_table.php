<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('grn_purchases', function (Blueprint $table) {
            $table->id();
            $table->string('grn_number', 50)->unique();
            $table->string('supplier_name');
            $table->date('purchase_date');
            $table->date('delivery_date')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'received', 'cancelled'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_purchases');
    }
};
