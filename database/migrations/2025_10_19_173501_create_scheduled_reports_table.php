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
        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', [
                'patient_census', 
                'bed_occupancy', 
                'lab_tat', 
                'pharmacy_consumption', 
                'revenue_department', 
                'disease_statistics'
            ]);
            $table->enum('frequency', ['daily', 'weekly', 'monthly']);
            $table->enum('format', ['pdf', 'excel']);
            $table->json('recipients'); // Array of email addresses
            $table->json('filters')->nullable(); // Department, ward, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamp('next_run_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->integer('run_count')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'next_run_at']);
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
    }
};
