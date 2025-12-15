<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes for better performance (skip foreign key for now due to type mismatch)
        Schema::table('payments', function (Blueprint $table) {
            // Check if indexes don't already exist
            if (!$this->indexExists('payments', 'payments_invoice_id_created_at_index')) {
                $table->index(['invoice_id', 'created_at']);
            }
            if (!$this->indexExists('payments', 'payments_method_index')) {
                $table->index('method');
            }
            if (!$this->indexExists('payments', 'payments_created_at_index')) {
                $table->index('created_at');
            }
        });

        // Add indexes to invoices table for better performance
        Schema::table('invoices', function (Blueprint $table) {
            if (!$this->indexExists('invoices', 'invoices_status_created_at_index')) {
                $table->index(['status', 'created_at']);
            }
            if (!$this->indexExists('invoices', 'invoices_patient_id_index')) {
                $table->index('patient_id');
            }
            if (!$this->indexExists('invoices', 'invoices_encounter_id_index')) {
                $table->index('encounter_id');
            }
        });
    }

    /**
     * Check if an index exists on a table (database-agnostic)
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = DB::connection();
        $driver = $connection->getDriverName();
        
        try {
            if ($driver === 'sqlite') {
                // SQLite: Check pragma index_list
                $indexes = DB::select("PRAGMA index_list({$table})");
                foreach ($indexes as $idx) {
                    if ($idx->name === $index) {
                        return true;
                    }
                }
                return false;
            } else {
                // MySQL/PostgreSQL: Use SHOW INDEX
                $indexes = DB::select("SHOW INDEX FROM {$table}");
                foreach ($indexes as $idx) {
                    if ($idx->Key_name === $index) {
                        return true;
                    }
                }
                return false;
            }
        } catch (\Exception $e) {
            // If checking fails, assume index doesn't exist
            return false;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['invoice_id', 'created_at']);
            $table->dropIndex(['method']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['patient_id']);
            $table->dropIndex(['encounter_id']);
        });
    }
};