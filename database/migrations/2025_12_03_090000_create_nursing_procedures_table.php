<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_procedures', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id');
            $table->unsignedBigInteger('encounter_id')->nullable();
            $table->foreignId('ordered_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->string('procedure_type');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->enum('priority', ['stat', 'urgent', 'routine'])->default('routine');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'])->default('pending');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->text('complications')->nullable();
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('encounter_id')->references('id')->on('encounters')->onDelete('set null');

            $table->index(['patient_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index(['priority', 'status']);
            $table->index(['scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_procedures');
    }
};
