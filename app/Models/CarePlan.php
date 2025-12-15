<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id',
        'plan_date',
        'shift',
        'status',
        'objectives',
        'nursing_notes',
        'doctor_notes',
        'diet',
        'hydration',
        'created_by'
    ];

    protected $casts = [
        'plan_date' => 'date:Y-m-d',
    ];

    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}