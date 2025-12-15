<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImagingOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'patient_id', 'ordered_by',
        'study_name', 'status', 'scheduled_at'
    ];

    public function encounter() { return $this->belongsTo(Encounter::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
    public function physician() { return $this->belongsTo(Physician::class, 'ordered_by'); }
    public function report() { return $this->hasOne(ImagingReport::class); }
}
