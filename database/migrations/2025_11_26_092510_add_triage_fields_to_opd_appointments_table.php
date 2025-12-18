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
        Schema::table('opd_appointments', function (Blueprint $table) {
            $table->enum('triage_status', ['pending', 'completed', 'skipped'])->default('pending')->after('status');
            $table->enum('triage_level', ['emergency', 'urgent', 'non-urgent', 'routine'])->nullable()->after('triage_status');
            $table->integer('triage_score')->nullable()->after('triage_level');
            $table->integer('pain_level')->nullable()->after('triage_score')->comment('Pain scale 0-10');
            $table->text('red_flags')->nullable()->after('pain_level')->comment('Critical symptoms');
            $table->decimal('temperature', 4, 1)->nullable()->after('red_flags');
            $table->string('blood_pressure', 20)->nullable()->after('temperature');
            $table->integer('heart_rate')->nullable()->after('blood_pressure');
            $table->integer('respiratory_rate')->nullable()->after('heart_rate');
            $table->integer('oxygen_saturation')->nullable()->after('respiratory_rate');
            $table->decimal('weight', 5, 2)->nullable()->after('oxygen_saturation');
            $table->decimal('height', 5, 2)->nullable()->after('weight');
            $table->text('triage_notes')->nullable()->after('height');
            $table->foreignId('triaged_by')->nullable()->constrained('users')->after('triage_notes');
            $table->timestamp('triaged_at')->nullable()->after('triaged_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('opd_appointments', function (Blueprint $table) {
            $table->dropForeign(['triaged_by']);
            $table->dropColumn([
                'triage_status',
                'triage_level',
                'triage_score',
                'pain_level',
                'red_flags',
                'temperature',
                'blood_pressure',
                'heart_rate',
                'respiratory_rate',
                'oxygen_saturation',
                'weight',
                'height',
                'triage_notes',
                'triaged_by',
                'triaged_at'
            ]);
        });
    }
};
