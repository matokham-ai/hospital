<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('bed_assignments', function (Blueprint $table) {
            $table->id();
            $table->integer('encounter_id');
            $table->integer('bed_id');
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('released_at')->nullable();
            $table->string('assigned_by');
            $table->string('released_by')->nullable();
            $table->text('assignment_notes')->nullable();
            $table->text('release_notes')->nullable();
            $table->timestamps();

         
     
        });
    }

    public function down(): void {
        Schema::dropIfExists('bed_assignments');
    }
};
