<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->integer('lab_order_id');
            $table->text('result')->nullable();
            $table->string('normal_range')->nullable();
            $table->string('remarks')->nullable();
            $table->string('validated_by')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};
