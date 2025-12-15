<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceCatalogue extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'category',
        'description',
        'unit_price',
        'unit_of_measure',
        'department_id',
        'is_active',
        'is_billable',
        'tax_rate'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean',
        'is_billable' => 'boolean',
    ];

    // Categories
    const CATEGORY_CONSULTATION = 'consultation';
    const CATEGORY_LAB_TEST = 'lab_test';
    const CATEGORY_IMAGING = 'imaging';
    const CATEGORY_PROCEDURE = 'procedure';
    const CATEGORY_MEDICATION = 'medication';
    const CATEGORY_CONSUMABLE = 'consumable';
    const CATEGORY_BED_CHARGE = 'bed_charge';
    const CATEGORY_NURSING = 'nursing';
    const CATEGORY_OTHER = 'other';

    const CATEGORIES = [
        self::CATEGORY_CONSULTATION => 'Consultation',
        self::CATEGORY_LAB_TEST => 'Lab Test',
        self::CATEGORY_IMAGING => 'Imaging',
        self::CATEGORY_PROCEDURE => 'Procedure',
        self::CATEGORY_MEDICATION => 'Medication',
        self::CATEGORY_CONSUMABLE => 'Consumable',
        self::CATEGORY_BED_CHARGE => 'Bed Charge',
        self::CATEGORY_NURSING => 'Nursing',
        self::CATEGORY_OTHER => 'Other',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'deptid');
    }

    public function billItems()
    {
        return $this->hasMany(BillItem::class, 'item_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBillable($query)
    {
        return $query->where('is_billable', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Generate a unique service code for this service
     */
    public static function generateUniqueCode(string $category, ?int $departmentId = null): string
    {
        $generator = app(\App\Services\ServiceCodeGeneratorService::class);
        return $generator->generateCode($category, $departmentId);
    }

    /**
     * Boot method to auto-generate codes if not provided
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($service) {
            if (empty($service->code)) {
                $service->code = self::generateUniqueCode(
                    $service->category,
                    $service->department_id
                );
            }
        });
    }
}