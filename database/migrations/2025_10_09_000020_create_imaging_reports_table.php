<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('imaging_reports', function (Blueprint $table) {
            $table->id();
            $table->integer('imaging_order_id');
            $table->text('findings')->nullable();
            $table->text('conclusion')->nullable();
            $table->string('validated_by');
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imaging_reports');
    }
};
