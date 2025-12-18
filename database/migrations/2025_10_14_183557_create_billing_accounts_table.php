<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('billing_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_no')->unique();
            $table->string('patient_id');
            $table->integer('encounter_id');
            $table->enum('status', ['open', 'closed', 'discharged'])->default('open');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->decimal('balance', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_accounts');
    }
};
