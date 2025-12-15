<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'recorded_by', 'temperature', 'systolic_bp', 'diastolic_bp',
        'heart_rate', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height',
        'bmi', 'notes', 'recorded_at'
    ];

    public function encounter() { return $this->belongsTo(Encounter::class); }
}
