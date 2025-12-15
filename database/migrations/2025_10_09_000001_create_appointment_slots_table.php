<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('appointment_slots', function (Blueprint $table) {
            $table->id(); // Auto-increment slot ID
            $table->string('physician_code', 20); // FK to physicians.physician_code
            $table->string('department_id')->nullable(); // FK to departments.id
            $table->date('slot_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration_minutes')->default(30);
            $table->integer('max_appointments')->default(1);
            $table->boolean('is_available')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

        });
    }

    public function down(): void {
        Schema::dropIfExists('appointment_slots');
    }
};
