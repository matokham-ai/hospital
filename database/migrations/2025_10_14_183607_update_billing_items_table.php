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
        Schema::table('billing_items', function (Blueprint $table) {
            // Rename table if needed
            if (Schema::hasTable('bill_items') && !Schema::hasTable('billing_items')) {
                Schema::rename('bill_items', 'billing_items');
            }
        });
        
        Schema::table('billing_items', function (Blueprint $table) {
            if (!Schema::hasColumn('billing_items', 'service_code')) {
                $table->string('service_code')->nullable();
            }
            if (!Schema::hasColumn('billing_items', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('billing_items', 'net_amount')) {
                $table->decimal('net_amount', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('billing_items', 'reference_type')) {
                $table->string('reference_type')->nullable();
            }
            if (!Schema::hasColumn('billing_items', 'reference_id')) {
                $table->unsignedBigInteger('reference_id')->nullable();
            }
            if (!Schema::hasColumn('billing_items', 'posted_at')) {
                $table->timestamp('posted_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('billing_items')) {
            Schema::table('billing_items', function (Blueprint $table) {
                if (Schema::hasColumn('billing_items', 'service_code')) $table->dropColumn('service_code');
                if (Schema::hasColumn('billing_items', 'discount_amount')) $table->dropColumn('discount_amount');
                if (Schema::hasColumn('billing_items', 'net_amount')) $table->dropColumn('net_amount');
                if (Schema::hasColumn('billing_items', 'reference_type')) $table->dropColumn('reference_type');
                if (Schema::hasColumn('billing_items', 'reference_id')) $table->dropColumn('reference_id');
                if (Schema::hasColumn('billing_items', 'posted_at')) $table->dropColumn('posted_at');
            });
        }
    }
};
