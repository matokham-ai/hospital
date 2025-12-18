<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Patients
        if (Schema::hasTable('patients') && !Schema::hasColumn('patients', 'branch_id')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Appointments
        if (Schema::hasTable('appointments') && !Schema::hasColumn('appointments', 'branch_id')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'appointment_date']);
            });
        }

        // OPD Appointments
        if (Schema::hasTable('opd_appointments') && !Schema::hasColumn('opd_appointments', 'branch_id')) {
            Schema::table('opd_appointments', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'appointment_date']);
            });
        }

        // Encounters (Consultations)
        if (Schema::hasTable('encounters') && !Schema::hasColumn('encounters', 'branch_id')) {
            Schema::table('encounters', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'created_at']);
            });
        }

        // Vital Signs
        if (Schema::hasTable('vital_signs') && !Schema::hasColumn('vital_signs', 'branch_id')) {
            Schema::table('vital_signs', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Triage Assessments
        if (Schema::hasTable('triage_assessments') && !Schema::hasColumn('triage_assessments', 'branch_id')) {
            Schema::table('triage_assessments', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Lab Orders
        if (Schema::hasTable('lab_orders') && !Schema::hasColumn('lab_orders', 'branch_id')) {
            Schema::table('lab_orders', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Lab Results
        if (Schema::hasTable('lab_results') && !Schema::hasColumn('lab_results', 'branch_id')) {
            Schema::table('lab_results', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Imaging Orders
        if (Schema::hasTable('imaging_orders') && !Schema::hasColumn('imaging_orders', 'branch_id')) {
            Schema::table('imaging_orders', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Imaging Reports
        if (Schema::hasTable('imaging_reports') && !Schema::hasColumn('imaging_reports', 'branch_id')) {
            Schema::table('imaging_reports', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Prescriptions
        if (Schema::hasTable('prescriptions') && !Schema::hasColumn('prescriptions', 'branch_id')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Dispensations
        if (Schema::hasTable('dispensations') && !Schema::hasColumn('dispensations', 'branch_id')) {
            Schema::table('dispensations', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'created_at']);
            });
        }

        // Pharmacy Stores
        if (Schema::hasTable('pharmacy_stores') && !Schema::hasColumn('pharmacy_stores', 'branch_id')) {
            Schema::table('pharmacy_stores', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Pharmacy Stock
        if (Schema::hasTable('pharmacy_stock') && !Schema::hasColumn('pharmacy_stock', 'branch_id')) {
            Schema::table('pharmacy_stock', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'drug_id']);
            });
        }

        // Stock Movements
        if (Schema::hasTable('stock_movements') && !Schema::hasColumn('stock_movements', 'branch_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'created_at']);
            });
        }

        // Wards
        if (Schema::hasTable('wards') && !Schema::hasColumn('wards', 'branch_id')) {
            Schema::table('wards', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Beds
        if (Schema::hasTable('beds') && !Schema::hasColumn('beds', 'branch_id')) {
            Schema::table('beds', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Bed Assignments
        if (Schema::hasTable('bed_assignments') && !Schema::hasColumn('bed_assignments', 'branch_id')) {
            Schema::table('bed_assignments', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Departments
        if (Schema::hasTable('departments') && !Schema::hasColumn('departments', 'branch_id')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Physicians
        if (Schema::hasTable('physicians') && !Schema::hasColumn('physicians', 'branch_id')) {
            Schema::table('physicians', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // Emergency Patients
        if (Schema::hasTable('emergency_patients') && !Schema::hasColumn('emergency_patients', 'branch_id')) {
            Schema::table('emergency_patients', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // OPD Queue
        if (Schema::hasTable('opd_queue') && !Schema::hasColumn('opd_queue', 'branch_id')) {
            Schema::table('opd_queue', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'status']);
            });
        }

        // Deposits
        if (Schema::hasTable('deposits') && !Schema::hasColumn('deposits', 'branch_id')) {
            Schema::table('deposits', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'created_at']);
            });
        }

        // Insurance Claims
        if (Schema::hasTable('insurance_claims') && !Schema::hasColumn('insurance_claims', 'branch_id')) {
            Schema::table('insurance_claims', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'claim_status']);
            });
        }

        // Ledger Entries
        if (Schema::hasTable('ledger_entries') && !Schema::hasColumn('ledger_entries', 'branch_id')) {
            Schema::table('ledger_entries', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->index(['branch_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'patients', 'appointments', 'opd_appointments', 'encounters', 'vital_signs',
            'triage_assessments', 'lab_orders', 'lab_results', 'imaging_orders', 'imaging_reports',
            'prescriptions', 'dispensations', 'pharmacy_stores', 'pharmacy_stock', 'stock_movements',
            'wards', 'beds', 'bed_assignments', 'departments', 'physicians',
            'emergency_patients', 'opd_queue', 'deposits', 'insurance_claims', 'ledger_entries'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'branch_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropForeign(['branch_id']);
                    $table->dropColumn('branch_id');
                });
            }
        }
    }
};
