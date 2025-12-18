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
        Schema::create('emergency_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_patient_id')->constrained()->onDelete('cascade');
            $table->enum('order_type', ['lab', 'imaging', 'medication', 'procedure', 'consultation']);
            $table->string('order_name');
            $table->text('order_details')->nullable();
            $table->enum('priority', ['stat', 'urgent', 'routine'])->default('routine');
            $table->enum('status', ['pending', 'in-progress', 'completed', 'cancelled'])->default('pending');
            $table->foreignId('ordered_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('ordered_at');
            $table->timestamp('completed_at')->nullable();
            $table->text('results')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emergency_orders');
    }
};
