<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Invoices
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->integer('encounter_id');
            $table->string('patient_id');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance', 10, 2)->default(0);
            $table->enum('status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->timestamps();
        });

        // Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->integer('invoice_id');
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['cash', 'mpesa', 'card', 'bank'])->default('cash');
            $table->string('reference_no')->nullable();
            $table->string('received_by');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
    }
};
