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
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('billing_account_id')->nullable()->constrained()->onDelete('cascade')->after('id');
            $table->text('notes')->nullable()->after('received_by');
            
            $table->index(['billing_account_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['billing_account_id']);
            $table->dropColumn(['billing_account_id', 'notes']);
            $table->dropIndex(['billing_account_id', 'created_at']);
        });
    }
};
