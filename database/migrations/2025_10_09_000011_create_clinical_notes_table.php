<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('clinical_notes', function (Blueprint $table) {
            $table->id();
            $table->integer('encounter_id');
            $table->enum('note_type', ['SOAP','PROGRESS','DISCHARGE','NURSING','CONSULTATION']);
            $table->text('subjective')->nullable();
            $table->text('objective')->nullable();
            $table->text('assessment')->nullable();
            $table->text('plan')->nullable();
            $table->text('content')->nullable();
            $table->text('created_by');
            $table->timestamp('note_datetime')->useCurrent();
            $table->timestamps();


        });
    }

    public function down(): void {
        Schema::dropIfExists('clinical_notes');
    }
};
