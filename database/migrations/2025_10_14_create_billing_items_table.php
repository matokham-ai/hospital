<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('billing_items')) {
            Schema::create('billing_items', function (Blueprint $table) {
            $table->id();

            // Links to Billing Account (main billing header)
            $table->foreignId('billing_account_id')
                ->constrained('billing_accounts')
                ->cascadeOnDelete();

            // Optional link to Encounter (for context)
            $table->foreignId('encounter_id')
                ->nullable()
                ->constrained('encounters')
                ->nullOnDelete();

            // Optional reference to Service Catalogue item
            $table->foreignId('item_id')
                ->nullable()
                ->constrained('service_catalogue')
                ->nullOnDelete();

            // Item classification
            $table->enum('item_type', [
                'consultation',
                'lab_test',
                'pharmacy',
                'procedure',
                'consumable',
                'bed_charge',
                'other'
            ])->index();

            // Description & pricing
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('amount', 10, 2)->default(0);

            // Lifecycle status (for verification or cancellation)
            $table->enum('status', ['pending', 'posted', 'cancelled'])->default('posted');

            // Audit info
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_items');
    }
};
