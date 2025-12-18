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
        // Helper function to check if index exists (database-agnostic)
        $indexExists = function ($table, $indexName) {
            $connection = DB::connection();
            $driver = $connection->getDriverName();
            
            try {
                if ($driver === 'sqlite') {
                    // SQLite: Check pragma index_list
                    $indexes = DB::select("PRAGMA index_list({$table})");
                    foreach ($indexes as $index) {
                        if ($index->name === $indexName) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    // MySQL/PostgreSQL: Use SHOW INDEX
                    $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
                    return !empty($indexes);
                }
            } catch (\Exception $e) {
                // If checking fails, assume index doesn't exist
                return false;
            }
        };
        // Add indexes to departments table
        Schema::table('departments', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('departments', 'idx_departments_status_sort')) {
                $table->index(['status', 'sort_order'], 'idx_departments_status_sort');
            }
            if (!$indexExists('departments', 'idx_departments_status_name')) {
                $table->index(['status', 'name'], 'idx_departments_status_name');
            }
            if (!$indexExists('departments', 'idx_departments_code')) {
                $table->index('code', 'idx_departments_code');
            }
            if (!$indexExists('departments', 'idx_departments_created_at')) {
                $table->index('created_at', 'idx_departments_created_at');
            }
        });

        // Add indexes to wards table
        Schema::table('wards', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('wards', 'idx_wards_dept_status')) {
                $table->index(['department_id', 'status'], 'idx_wards_dept_status');
            }
            if (!$indexExists('wards', 'idx_wards_status_name')) {
                $table->index(['status', 'name'], 'idx_wards_status_name');
            }
            if (!$indexExists('wards', 'idx_wards_type')) {
                $table->index('ward_type', 'idx_wards_type');
            }
            if (!$indexExists('wards', 'idx_wards_capacity')) {
                $table->index('total_beds', 'idx_wards_capacity');
            }
            if (!$indexExists('wards', 'idx_wards_created_at')) {
                $table->index('created_at', 'idx_wards_created_at');
            }
        });

        // Add indexes to beds table
        Schema::table('beds', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('beds', 'idx_beds_ward_status')) {
                $table->index(['ward_id', 'status'], 'idx_beds_ward_status');
            }
            if (!$indexExists('beds', 'idx_beds_status_type')) {
                $table->index(['status', 'bed_type'], 'idx_beds_status_type');
            }
            if (!$indexExists('beds', 'idx_beds_number')) {
                $table->index('bed_number', 'idx_beds_number');
            }
            if (!$indexExists('beds', 'idx_beds_last_occupied')) {
                $table->index('last_occupied_at', 'idx_beds_last_occupied');
            }
            if (!$indexExists('beds', 'idx_beds_created_at')) {
                $table->index('created_at', 'idx_beds_created_at');
            }
        });

        // Add indexes to test_catalogs table
        Schema::table('test_catalogs', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('test_catalogs', 'idx_tests_dept_status')) {
                $table->index(['deptid', 'status'], 'idx_tests_dept_status');
            }
            if (!$indexExists('test_catalogs', 'idx_tests_category_status')) {
                $table->index(['category_id', 'status'], 'idx_tests_category_status');
            }
            if (!$indexExists('test_catalogs', 'idx_tests_status_name')) {
                $table->index(['status', 'name'], 'idx_tests_status_name');
            }
            if (!$indexExists('test_catalogs', 'idx_tests_code')) {
                $table->index('code', 'idx_tests_code');
            }
            if (!$indexExists('test_catalogs', 'idx_tests_price')) {
                $table->index('price', 'idx_tests_price');
            }
            if (!$indexExists('test_catalogs', 'idx_tests_tat')) {
                $table->index('turnaround_time', 'idx_tests_tat');
            }
            if (!$indexExists('test_catalogs', 'idx_tests_created_at')) {
                $table->index('created_at', 'idx_tests_created_at');
            }
            
            // Composite index for search operations
            if (!$indexExists('test_catalogs', 'idx_tests_search')) {
                $table->index(['name', 'category_id', 'status'], 'idx_tests_search');
            }
        });

        // Add indexes to drug_formulary table
        Schema::table('drug_formulary', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('drug_formulary', 'idx_drugs_status_name')) {
                $table->index(['status', 'name'], 'idx_drugs_status_name');
            }
            if (!$indexExists('drug_formulary', 'idx_drugs_atc_code')) {
                $table->index('atc_code', 'idx_drugs_atc_code');
            }
            if (!$indexExists('drug_formulary', 'idx_drugs_generic_name')) {
                $table->index('generic_name', 'idx_drugs_generic_name');
            }
            if (!$indexExists('drug_formulary', 'idx_drugs_stock_reorder')) {
                $table->index(['stock_quantity', 'reorder_level'], 'idx_drugs_stock_reorder');
            }
            if (!$indexExists('drug_formulary', 'idx_drugs_price')) {
                $table->index('unit_price', 'idx_drugs_price');
            }
            if (!$indexExists('drug_formulary', 'idx_drugs_form')) {
                $table->index('form', 'idx_drugs_form');
            }
            if (!$indexExists('drug_formulary', 'idx_drugs_created_at')) {
                $table->index('created_at', 'idx_drugs_created_at');
            }
            
            // Composite index for stock management
            if (!$indexExists('drug_formulary', 'idx_drugs_status_stock')) {
                $table->index(['status', 'stock_quantity'], 'idx_drugs_status_stock');
            }
            
            // Full-text search index for name and generic name (MySQL only)
            if (!$indexExists('drug_formulary', 'idx_drugs_fulltext_search')) {
                $connection = DB::connection();
                $driver = $connection->getDriverName();
                
                // Only create fulltext index for MySQL
                if ($driver === 'mysql') {
                    $table->fullText(['name', 'generic_name'], 'idx_drugs_fulltext_search');
                }
            }
        });

        // Add indexes to master_data_audits table for audit queries
        Schema::table('master_data_audits', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('master_data_audits', 'idx_audits_entity')) {
                $table->index(['entity_type', 'entity_id'], 'idx_audits_entity');
            }
            if (!$indexExists('master_data_audits', 'idx_audits_user_date')) {
                $table->index(['user_id', 'created_at'], 'idx_audits_user_date');
            }
            if (!$indexExists('master_data_audits', 'idx_audits_action_date')) {
                $table->index(['action', 'created_at'], 'idx_audits_action_date');
            }
            if (!$indexExists('master_data_audits', 'idx_audits_created_at')) {
                $table->index('created_at', 'idx_audits_created_at');
            }
            
            // Composite index for recent activity queries
            if (!$indexExists('master_data_audits', 'idx_audits_type_date')) {
                $table->index(['entity_type', 'created_at'], 'idx_audits_type_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Helper function to check if index exists
        $indexExists = function ($table, $indexName) {
            try {
                $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
                return !empty($indexes);
            } catch (\Exception $e) {
                return false;
            }
        };

        // Drop indexes from departments table
        Schema::table('departments', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('departments', 'idx_departments_status_sort')) $table->dropIndex('idx_departments_status_sort');
            if ($indexExists('departments', 'idx_departments_status_name')) $table->dropIndex('idx_departments_status_name');
            if ($indexExists('departments', 'idx_departments_code')) $table->dropIndex('idx_departments_code');
            if ($indexExists('departments', 'idx_departments_created_at')) $table->dropIndex('idx_departments_created_at');
        });

        // Drop indexes from wards table
        // Note: idx_wards_dept_status may be used by foreign key constraints, so we skip it
        Schema::table('wards', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('wards', 'idx_wards_status_name')) $table->dropIndex('idx_wards_status_name');
            if ($indexExists('wards', 'idx_wards_type')) $table->dropIndex('idx_wards_type');
            if ($indexExists('wards', 'idx_wards_capacity')) $table->dropIndex('idx_wards_capacity');
            if ($indexExists('wards', 'idx_wards_created_at')) $table->dropIndex('idx_wards_created_at');
        });

        // Drop indexes from beds table
        Schema::table('beds', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('beds', 'idx_beds_ward_status')) $table->dropIndex('idx_beds_ward_status');
            if ($indexExists('beds', 'idx_beds_status_type')) $table->dropIndex('idx_beds_status_type');
            if ($indexExists('beds', 'idx_beds_number')) $table->dropIndex('idx_beds_number');
            if ($indexExists('beds', 'idx_beds_last_occupied')) $table->dropIndex('idx_beds_last_occupied');
            if ($indexExists('beds', 'idx_beds_created_at')) $table->dropIndex('idx_beds_created_at');
        });

        // Drop indexes from test_catalogs table
        // Note: Indexes with foreign key columns are skipped to avoid constraint errors
        Schema::table('test_catalogs', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('test_catalogs', 'idx_tests_status_name')) $table->dropIndex('idx_tests_status_name');
            if ($indexExists('test_catalogs', 'idx_tests_code')) $table->dropIndex('idx_tests_code');
            if ($indexExists('test_catalogs', 'idx_tests_price')) $table->dropIndex('idx_tests_price');
            if ($indexExists('test_catalogs', 'idx_tests_tat')) $table->dropIndex('idx_tests_tat');
            if ($indexExists('test_catalogs', 'idx_tests_created_at')) $table->dropIndex('idx_tests_created_at');
            if ($indexExists('test_catalogs', 'idx_tests_search')) $table->dropIndex('idx_tests_search');
        });

        // Drop indexes from drug_formulary table
        Schema::table('drug_formulary', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('drug_formulary', 'idx_drugs_status_name')) $table->dropIndex('idx_drugs_status_name');
            if ($indexExists('drug_formulary', 'idx_drugs_atc_code')) $table->dropIndex('idx_drugs_atc_code');
            if ($indexExists('drug_formulary', 'idx_drugs_generic_name')) $table->dropIndex('idx_drugs_generic_name');
            if ($indexExists('drug_formulary', 'idx_drugs_stock_reorder')) $table->dropIndex('idx_drugs_stock_reorder');
            if ($indexExists('drug_formulary', 'idx_drugs_price')) $table->dropIndex('idx_drugs_price');
            if ($indexExists('drug_formulary', 'idx_drugs_form')) $table->dropIndex('idx_drugs_form');
            if ($indexExists('drug_formulary', 'idx_drugs_created_at')) $table->dropIndex('idx_drugs_created_at');
            if ($indexExists('drug_formulary', 'idx_drugs_status_stock')) $table->dropIndex('idx_drugs_status_stock');
            
            // Only drop fulltext index if it exists (MySQL only)
            $connection = DB::connection();
            $driver = $connection->getDriverName();
            if ($driver === 'mysql' && $indexExists('drug_formulary', 'idx_drugs_fulltext_search')) {
                $table->dropIndex('idx_drugs_fulltext_search');
            }
        });

        // Drop indexes from master_data_audits table
        Schema::table('master_data_audits', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('master_data_audits', 'idx_audits_entity')) $table->dropIndex('idx_audits_entity');
            if ($indexExists('master_data_audits', 'idx_audits_user_date')) $table->dropIndex('idx_audits_user_date');
            if ($indexExists('master_data_audits', 'idx_audits_action_date')) $table->dropIndex('idx_audits_action_date');
            if ($indexExists('master_data_audits', 'idx_audits_created_at')) $table->dropIndex('idx_audits_created_at');
            if ($indexExists('master_data_audits', 'idx_audits_type_date')) $table->dropIndex('idx_audits_type_date');
        });
    }
};