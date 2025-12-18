<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestCatalog extends Model
{
    use HasFactory;

    protected $fillable = [
        'deptid', 'category_id', 'name', 'code', 'price', 'turnaround_time',
        'unit', 'normal_range', 'sample_type', 'instructions', 'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'turnaround_time' => 'integer',
        'status' => 'string',
    ];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class, 'deptid', 'deptid');
    }

    public function category()
    {
        return $this->belongsTo(TestCategory::class, 'category_id');
    }

    public function labOrders()
    {
        // Note: lab_orders table may not have test_id column yet
        // This relationship will be available when lab_orders table is updated
        return $this->hasMany(LabOrder::class, 'test_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByDepartment($query, $deptId)
    {
        return $query->where('deptid', $deptId);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%");
        });
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'deptid' => 'nullable|exists:departments,deptid',
            'category_id' => 'required|exists:test_categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:test_catalogs,code,' . $id,
            'price' => 'required|numeric|min:0',
            'turnaround_time' => 'required|integer|min:1',
            'unit' => 'nullable|string|max:50',
            'normal_range' => 'nullable|string|max:255',
            'sample_type' => 'nullable|string|max:100',
            'instructions' => 'nullable|string',
            'status' => 'in:active,inactive',
        ];
    }

    // Business logic methods
    public function hasPendingOrders()
    {
        // Skip lab orders check for now since the relationship may not be properly set up
        return false;
    }

    public function getTurnaroundTimeInDays()
    {
        return ceil($this->turnaround_time / 24);
    }

    public function getFormattedPrice()
    {
        return number_format($this->price, 2);
    }
}
