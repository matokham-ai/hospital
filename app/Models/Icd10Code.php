<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Icd10Code extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'category',
        'subcategory',
        'usage_count',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer'
    ];

    // Relationships
    public function diagnoses()
    {
        return $this->hasMany(OpdDiagnosis::class, 'icd10_code', 'code');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePopular($query, $limit = 10)
    {
        return $query->active()
                    ->orderBy('usage_count', 'desc')
                    ->limit($limit);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->active()->where('category', $category);
    }

    // Methods
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }

    public static function search($term, $limit = 20)
    {
        return static::active()
            ->where(function ($query) use ($term) {
                $query->where('code', 'like', "%{$term}%")
                      ->orWhere('description', 'like', "%{$term}%");
            })
            ->orderBy('usage_count', 'desc')
            ->limit($limit)
            ->get();
    }
}