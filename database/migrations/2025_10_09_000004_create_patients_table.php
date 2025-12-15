<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('patients', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('hospital_id', 20)->unique();

            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('middle_name', 100)->nullable();

            $table->string('phone')->nullable()->unique();
            $table->string('email')->nullable()->unique();

            $table->date('date_of_birth');
            $table->enum('gender', ['M', 'F', 'O']);
            $table->string('marital_status', 20)->nullable();
            $table->string('occupation', 100)->nullable();
            $table->string('nationality', 50)->nullable();
            $table->string('religion', 50)->nullable();

            $table->longText('insurance_info')->nullable();
            $table->longText('allergies')->default('[]');
            $table->longText('chronic_conditions')->default('[]');
            $table->longText('alerts')->default('[]');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void {
        Schema::dropIfExists('patients');
    }
};
