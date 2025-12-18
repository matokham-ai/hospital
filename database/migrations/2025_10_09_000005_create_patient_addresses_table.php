<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('patient_addresses', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id');
            $table->enum('address_type', ['HOME','WORK','BILLING','OTHER'])->default('HOME');
            $table->string('address_line1', 200)->nullable();
            $table->string('address_line2', 200)->nullable();
            $table->string('village', 100)->nullable();
            $table->string('town_city', 100)->nullable();
            $table->string('sub_county', 100)->nullable();
            $table->string('county', 100)->nullable();
            $table->string('state_province', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->default('Kenya');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();
        });
    }

    public function down(): void {
        Schema::dropIfExists('patient_addresses');
    }
};
