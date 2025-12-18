<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('patient_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id');
            $table->enum('contact_type', ['PRIMARY','EMERGENCY','WORK','OTHER'])->default('PRIMARY');
            $table->string('phone_number', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('relationship', 50)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();
        });
    }

    public function down(): void {
        Schema::dropIfExists('patient_contacts');
    }
};
