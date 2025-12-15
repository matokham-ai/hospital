<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_claims', function (Blueprint $table) {
            $table->id();

            // Link to billing account
            $table->foreignId('billing_account_id')
                ->constrained('billing_accounts')
                ->cascadeOnDelete();

            // Insurance details
            $table->string('insurer_name');
            $table->string('policy_number', 100)->nullable();
            $table->string('claim_number', 100)->nullable();

            // Claim info
            $table->enum('claim_status', ['PENDING', 'APPROVED', 'REJECTED', 'PAID'])
                ->default('PENDING');
            $table->decimal('claim_amount', 10, 2)->default(0.00);
            $table->dateTime('submitted_date')->nullable();

            // User who submitted
            $table->foreignId('submitted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_claims');
    }
};
