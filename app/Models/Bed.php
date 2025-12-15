<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Bed extends Model
{
    use HasFactory;

    protected $fillable = [
        'ward_id', 'bed_number', 'bed_type', 'status', 'last_occupied_at', 'maintenance_notes'
    ];

    protected $casts = [
        'last_occupied_at' => 'datetime',
        'bed_type' => 'string',
        'status' => 'string',
    ];

    // Relationships
    public function ward()
    {
        return $this->belongsTo(Ward::class, 'ward_id', 'wardid');
    }

    public function bedAssignments()
    {
        return $this->hasMany(BedAssignment::class);
    }

    public function currentAssignment()
    {
        return $this->hasOne(BedAssignment::class)->whereNull('discharge_date');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeOccupied($query)
    {
        return $query->where('status', 'occupied');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('bed_type', $type);
    }

    public function scopeByWard($query, $wardId)
    {
        return $query->where('ward_id', $wardId);
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'ward_id' => 'required|exists:wards,wardid',
            'bed_number' => 'required|string|max:20',
            'bed_type' => 'required|in:STANDARD,ICU,ISOLATION,PRIVATE',
            'status' => 'in:available,occupied,maintenance,reserved,out_of_order',
            'maintenance_notes' => 'nullable|string',
        ];
    }

    // Business logic methods
    public function isAvailable()
    {
        return $this->status === 'available';
    }

    public function isOccupied()
    {
        return $this->status === 'occupied';
    }

    public function canBeAssigned()
    {
        return in_array($this->status, ['available', 'reserved']);
    }

    public function markAsOccupied()
    {
        $this->update([
            'status' => 'occupied',
            'last_occupied_at' => Carbon::now()
        ]);
    }

    public function markAsAvailable()
    {
        $this->update(['status' => 'available']);
    }

    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'available' => 'green',
            'occupied' => 'red',
            'maintenance' => 'yellow',
            'reserved' => 'blue',
            'out_of_order' => 'orange',
            default => 'gray'
        };
    }
}
