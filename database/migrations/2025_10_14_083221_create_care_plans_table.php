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
        Schema::create('care_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('encounter_id')->constrained()->onDelete('cascade');
            $table->date('plan_date');
            $table->string('shift', 50);
            $table->text('objectives');
            $table->text('nursing_notes')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->string('diet')->nullable();
            $table->string('hydration')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('care_plans');
    }
};
