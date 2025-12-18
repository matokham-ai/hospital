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
        Schema::table('drug_formulary', function (Blueprint $table) {
            // Add missing formulation field
            $table->string('formulation', 100)->nullable()->after('form')
                ->comment('e.g. sustained-release, enteric-coated, sugar-free, reconstituted');
            
            // Add additional useful fields
            $table->string('dosage_form_details', 200)->nullable()->after('formulation')
                ->comment('Additional details about dosage form');
            
            $table->decimal('cost_price', 10, 2)->nullable()->after('unit_price')
                ->comment('Cost price for margin calculation');
            
            $table->string('storage_conditions', 100)->nullable()->after('expiry_date')
                ->comment('Storage requirements like temperature, humidity');
            
            $table->boolean('requires_prescription')->default(true)->after('status')
                ->comment('Whether drug requires prescription');
            
            $table->string('therapeutic_class', 100)->nullable()->after('atc_code')
                ->comment('Therapeutic classification');
            
            $table->json('contraindications')->nullable()->after('notes')
                ->comment('List of contraindications');
            
            $table->json('side_effects')->nullable()->after('contraindications')
                ->comment('Common side effects');
            
            // Add audit fields
            $table->unsignedBigInteger('created_by')->nullable()->after('side_effects');
            $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
            
            // Add additional indexes for better performance
            $table->index(['form', 'status']);
            $table->index(['manufacturer']);
            $table->index(['expiry_date']);
            $table->index(['requires_prescription']);
            $table->index(['therapeutic_class']);
            
            // Add foreign key constraints for audit fields
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drug_formulary', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            
            // Drop indexes
            $table->dropIndex(['form', 'status']);
            $table->dropIndex(['manufacturer']);
            $table->dropIndex(['expiry_date']);
            $table->dropIndex(['requires_prescription']);
            $table->dropIndex(['therapeutic_class']);
            
            // Drop columns
            $table->dropColumn([
                'formulation',
                'dosage_form_details',
                'cost_price',
                'storage_conditions',
                'requires_prescription',
                'therapeutic_class',
                'contraindications',
                'side_effects',
                'created_by',
                'updated_by'
            ]);
        });
    }
};