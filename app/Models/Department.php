<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $primaryKey = 'deptid';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'deptid', 'name', 'code', 'description', 'icon', 'sort_order', 'status'
    ];

    protected $casts = [
        'status' => 'string',
        'sort_order' => 'integer',
    ];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'deptid';
    }

    /**
     * Boot the model and add event listeners
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($department) {
            if (empty($department->deptid)) {
                $department->deptid = static::generateDepartmentId($department->code);
            }
        });
    }

    /**
     * Generate a unique department ID based on code
     */
    protected static function generateDepartmentId(string $code): string
    {
        // Use the code as base, ensure it's uppercase and clean
        $baseId = strtoupper(preg_replace('/[^A-Z0-9]/', '', $code));
        
        // If the base ID is available, use it
        if (!static::where('deptid', $baseId)->exists()) {
            return $baseId;
        }
        
        // If not available, append a number
        $counter = 1;
        do {
            $deptid = $baseId . sprintf('%02d', $counter);
            $counter++;
        } while (static::where('deptid', $deptid)->exists() && $counter <= 99);
        
        if ($counter > 99) {
            // Fallback to timestamp-based ID if all numbered variants are taken
            $deptid = $baseId . substr(time(), -4);
        }
        
        return $deptid;
    }

    // Relationships
    public function physicians() 
    { 
        // Note: physicians table doesn't have department_id yet
        // This relationship will be available when physicians table is updated
        return $this->hasMany(Physician::class, 'department_id'); 
    }

    public function wards() 
    { 
        return $this->hasMany(Ward::class, 'department_id', 'deptid'); 
    }

    public function testCatalogs() 
    { 
        return $this->hasMany(TestCatalog::class, 'deptid', 'deptid'); 
    }

    public function serviceCatalogues() 
    { 
        return $this->hasMany(ServiceCatalogue::class, 'department_id', 'deptid'); 
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'deptid' => 'required|string|max:20|unique:departments,deptid,' . $id . ',deptid',
            'name' => 'required|string|max:191',
            'code' => 'required|string|max:191|unique:departments,code,' . $id . ',deptid',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'status' => 'required|in:active,inactive',
        ];
    }

    // Business logic methods
    public function canBeDeleted()
    {
        // Skip physicians check for now since the table doesn't have department_id
        return $this->wards()->count() === 0 && 
               $this->testCatalogs()->count() === 0;
    }

    public function getReferencesCount()
    {
        return [
            // 'physicians' => $this->physicians()->count(), // Skip for now
            'wards' => $this->wards()->count(),
            'test_catalogs' => $this->testCatalogs()->count(),
        ];
    }
}
