<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add discount audit fields to billing_accounts
        Schema::table('billing_accounts', function (Blueprint $table) {
            $table->enum('discount_type', ['percentage', 'fixed', 'none'])->default('none')->after('discount_amount');
            $table->decimal('discount_percentage', 5, 2)->default(0)->after('discount_type');
            $table->text('discount_reason')->nullable()->after('discount_percentage');
            $table->foreignId('discount_approved_by')->nullable()->after('discount_reason')->constrained('users')->onDelete('set null');
            $table->timestamp('discount_approved_at')->nullable()->after('discount_approved_by');
            
            $table->index(['discount_approved_by', 'discount_approved_at']);
        });

        // Add discount audit fields to billing_items
        Schema::table('billing_items', function (Blueprint $table) {
            $table->enum('discount_type', ['percentage', 'fixed', 'none'])->default('none')->after('discount_amount');
            $table->decimal('discount_percentage', 5, 2)->default(0)->after('discount_type');
            $table->text('discount_reason')->nullable()->after('discount_percentage');
            $table->foreignId('discount_approved_by')->nullable()->after('discount_reason')->constrained('users')->onDelete('set null');
            
            $table->index('discount_approved_by');
        });

        // Add discount audit fields to invoices
        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('discount_type', ['percentage', 'fixed', 'none'])->default('none')->after('discount');
            $table->decimal('discount_percentage', 5, 2)->default(0)->after('discount_type');
            $table->text('discount_reason')->nullable()->after('discount_percentage');
            $table->foreignId('discount_approved_by')->nullable()->after('discount_reason')->constrained('users')->onDelete('set null');
            
            $table->index('discount_approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('billing_accounts', function (Blueprint $table) {
            $table->dropForeign(['discount_approved_by']);
            $table->dropIndex(['discount_approved_by', 'discount_approved_at']);
            $table->dropColumn([
                'discount_type',
                'discount_percentage',
                'discount_reason',
                'discount_approved_by',
                'discount_approved_at'
            ]);
        });

        Schema::table('billing_items', function (Blueprint $table) {
            $table->dropForeign(['discount_approved_by']);
            $table->dropIndex(['discount_approved_by']);
            $table->dropColumn([
                'discount_type',
                'discount_percentage',
                'discount_reason',
                'discount_approved_by'
            ]);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['discount_approved_by']);
            $table->dropIndex(['discount_approved_by']);
            $table->dropColumn([
                'discount_type',
                'discount_percentage',
                'discount_reason',
                'discount_approved_by'
            ]);
        });
    }
};
