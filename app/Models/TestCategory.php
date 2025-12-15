<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'description', 'color', 'sort_order', 'is_active'
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function testCatalogs()
    {
        return $this->hasMany(TestCatalog::class, 'category_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:test_categories,code,' . $id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ];
    }
}
