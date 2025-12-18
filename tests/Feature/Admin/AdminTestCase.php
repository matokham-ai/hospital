<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

abstract class AdminTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create only the essential tables for admin tests
        $this->createEssentialTables();
    }

    protected function createEssentialTables(): void
    {
        // Create users table (should already exist from default migrations)
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // Create departments table
        if (!Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->string('icon')->nullable();
                $table->text('description')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // Create wards table
        if (!Schema::hasTable('wards')) {
            Schema::create('wards', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->enum('type', ['general', 'icu', 'maternity', 'pediatric', 'surgical'])->default('general');
                $table->foreignId('department_id')->constrained()->onDelete('cascade');
                $table->integer('capacity')->default(0);
                $table->integer('floor_number')->nullable();
                $table->text('description')->nullable();
                $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
                $table->timestamps();
            });
        }

        // Create beds table
        if (!Schema::hasTable('beds')) {
            Schema::create('beds', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ward_id')->constrained()->onDelete('cascade');
                $table->string('bed_number');
                $table->enum('bed_type', ['standard', 'icu', 'isolation', 'maternity', 'pediatric'])->default('standard');
                $table->enum('status', ['available', 'occupied', 'maintenance', 'reserved', 'out_of_order'])->default('available');
                $table->timestamp('last_occupied_at')->nullable();
                $table->text('maintenance_notes')->nullable();
                $table->timestamps();
                
                $table->unique(['ward_id', 'bed_number']);
            });
        }

        // Create test_categories table
        if (!Schema::hasTable('test_categories')) {
            Schema::create('test_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // Create test_catalogs table
        if (!Schema::hasTable('test_catalogs')) {
            Schema::create('test_catalogs', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->foreignId('department_id')->nullable()->constrained()->onDelete('set null');
                $table->foreignId('category_id')->nullable()->constrained('test_categories')->onDelete('set null');
                $table->decimal('price', 10, 2);
                $table->integer('turnaround_time'); // in hours
                $table->string('unit')->default('hours');
                $table->string('sample_type')->nullable();
                $table->string('normal_range')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();
            });
        }

        // Create drug_formulary table
        if (!Schema::hasTable('drug_formulary')) {
            Schema::create('drug_formulary', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('generic_name');
                $table->string('atc_code');
                $table->string('strength');
                $table->enum('form', ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops'])->default('tablet');
                $table->integer('stock_quantity')->default(0);
                $table->integer('reorder_level')->default(0);
                $table->decimal('unit_price', 10, 2);
                $table->string('manufacturer')->nullable();
                $table->enum('status', ['active', 'discontinued'])->default('active');
                $table->timestamps();
            });
        }

        // Create drug_substitutes table
        if (!Schema::hasTable('drug_substitutes')) {
            Schema::create('drug_substitutes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('drug_id')->constrained('drug_formulary')->onDelete('cascade');
                $table->foreignId('substitute_drug_id')->constrained('drug_formulary')->onDelete('cascade');
                $table->string('substitution_reason')->nullable();
                $table->boolean('is_preferred')->default(false);
                $table->timestamps();
                
                $table->unique(['drug_id', 'substitute_drug_id']);
            });
        }

        // Create master_data_audits table
        if (!Schema::hasTable('master_data_audits')) {
            Schema::create('master_data_audits', function (Blueprint $table) {
                $table->id();
                $table->string('entity_type');
                $table->unsignedBigInteger('entity_id');
                $table->enum('action', ['created', 'updated', 'deleted', 'status_changed']);
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                
                $table->index(['entity_type', 'entity_id']);
                $table->index(['user_id', 'created_at']);
            });
        }
    }
}