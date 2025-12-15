<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ward extends Model
{
    use HasFactory;

    protected $primaryKey = 'wardid';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'wardid', 'name', 'code', 'department_id', 'ward_type',
        'total_beds', 'status', 'floor_number', 'description'
    ];

    protected $casts = [
        'total_beds' => 'integer',
        'ward_type' => 'string',
    ];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'deptid');
    }

    public function beds()
    {
        return $this->hasMany(Bed::class, 'ward_id', 'wardid');
    }

    public function bedAssignments()
    {
        return $this->hasManyThrough(BedAssignment::class, Bed::class, 'ward_id', 'bed_id', 'wardid', 'id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('ward_type', $type);
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'wardid' => 'required|string|max:20|unique:wards,wardid,' . $id . ',wardid',
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:wards,code,' . $id . ',wardid',
            'department_id' => 'nullable|exists:departments,deptid',
            'ward_type' => 'required|in:GENERAL,ICU,MATERNITY,PEDIATRIC,ISOLATION,PRIVATE',
            'total_beds' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
        ];
    }

    // Business logic methods
    public function getCurrentOccupancy()
    {
        return $this->beds()->where('status', 'OCCUPIED')->count();
    }

    public function getOccupancyPercentage()
    {
        if ($this->total_beds === 0) return 0;
        return round(($this->getCurrentOccupancy() / $this->total_beds) * 100, 1);
    }

    public function getAvailableBeds()
    {
        return $this->beds()->where('status', 'AVAILABLE');
    }

    public function canAccommodateMoreBeds()
    {
        return $this->beds()->count() < $this->total_beds;
    }
}
