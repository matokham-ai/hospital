<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_order_id', 'parameter_name', 'value', 'result', 'unit', 'reference_range', 'normal_range', 
        'status', 'description', 'remarks', 'validated_by', 'validated_at'
    ];

    // Accessors for API compatibility
    public function getTestNameAttribute($value)
    {
        return $this->parameter_name ?: $this->labOrder?->test_name;
    }

    public function getResultValueAttribute($value)
    {
        return $this->value ?: $this->result;
    }

    public function getAbnormalFlagAttribute($value)
    {
        return $this->status;
    }

    public function labOrder() { return $this->belongsTo(LabOrder::class); }
    public function validator() { return $this->belongsTo(User::class, 'validated_by'); }
}
