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
        Schema::table('billing_accounts', function (Blueprint $table) {
            $table->decimal('discount_amount', 10, 2)->default(0)->after('total_amount');
            $table->decimal('net_amount', 10, 2)->default(0)->after('discount_amount');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null')->after('balance');
            $table->timestamp('closed_at')->nullable()->after('created_by');
            
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('billing_accounts', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['discount_amount', 'net_amount', 'created_by', 'closed_at']);
            $table->dropIndex(['status', 'created_at']);
        });
    }
};
