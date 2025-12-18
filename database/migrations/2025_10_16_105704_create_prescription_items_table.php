<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drug_formulary')->cascadeOnDelete();
            $table->string('dose', 50)->nullable();
            $table->string('frequency', 50)->nullable();
            $table->string('duration', 50)->nullable();
            $table->integer('quantity')->default(0);
            $table->string('route', 50)->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
