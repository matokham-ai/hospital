<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();

            // Basic accounting entry info
            $table->date('entry_date')->index();
            $table->string('account_head', 100); // e.g., "Pharmacy Sales", "Consultation Fees"
            $table->decimal('debit', 12, 2)->default(0.00);
            $table->decimal('credit', 12, 2)->default(0.00);
            $table->text('narration')->nullable();

            // Optional linkage for traceability
            $table->foreignId('billing_account_id')
                ->nullable()
                ->constrained('billing_accounts')
                ->nullOnDelete();

            // Created by user
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
    }
};
