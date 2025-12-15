<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();

            // Link to IPD encounter
            $table->foreignId('encounter_id')
                ->constrained('encounters')
                ->cascadeOnDelete();

            // Deposit details
            $table->decimal('amount', 10, 2);
            $table->enum('mode', ['CASH', 'MPESA', 'CARD', 'BANK'])->default('CASH');
            $table->string('reference_no', 100)->nullable();
            $table->dateTime('deposit_date')->useCurrent();

            // Received by user
            $table->foreignId('received_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Optional remarks
            $table->text('remarks')->nullable();

            // Audit fields
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
