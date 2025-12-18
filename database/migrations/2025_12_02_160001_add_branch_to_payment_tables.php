<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add branch_id to payments table
        if (!Schema::hasColumn('payments', 'branch_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'created_at']);
            });
        }

        // Add branch_id to billing_accounts table
        if (!Schema::hasColumn('billing_accounts', 'branch_id')) {
            Schema::table('billing_accounts', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Add branch_id to invoices table
        if (!Schema::hasColumn('invoices', 'branch_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Add branch_id to users table
        if (!Schema::hasColumn('users', 'branch_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('payments', 'branch_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }

        if (Schema::hasColumn('billing_accounts', 'branch_id')) {
            Schema::table('billing_accounts', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }

        if (Schema::hasColumn('invoices', 'branch_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }

        if (Schema::hasColumn('users', 'branch_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }
    }
};
