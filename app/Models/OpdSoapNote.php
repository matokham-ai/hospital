<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpdSoapNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'doctor_id',
        'subjective',
        'objective',
        'assessment',
        'plan',
        'blood_pressure',
        'temperature',
        'pulse_rate',
        'respiratory_rate',
        'weight',
        'height',
        'bmi',
        'oxygen_saturation',
        'physical_examination',
        'investigations_ordered',
        'medications_prescribed',
        'follow_up_instructions',
        'next_visit_date',
        'is_draft',
        'completed_at'
    ];

    protected $casts = [
        'temperature' => 'decimal:1',
        'weight' => 'decimal:2',
        'height' => 'decimal:2',
        'bmi' => 'decimal:1',
        'pulse_rate' => 'integer',
        'respiratory_rate' => 'integer',
        'oxygen_saturation' => 'integer',
        'is_draft' => 'boolean',
        'next_visit_date' => 'date',
        'completed_at' => 'datetime'
    ];

    // Relationships
    public function appointment()
    {
        return $this->belongsTo(OpdAppointment::class, 'appointment_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function doctor()
    {
         return $this->belongsTo(\App\Models\Physician::class, 'doctor_id', 'physician_code');
    }

    public function diagnoses()
    {
        return $this->hasMany(OpdDiagnosis::class, 'soap_note_id');
    }

    // Scopes
    public function scopeDrafts($query)
    {
        return $query->where('is_draft', true);
    }

    public function scopeCompleted($query)
    {
        return $query->where('is_draft', false);
    }

    // Methods
    public function calculateBMI()
    {
        if ($this->weight && $this->height) {
            $heightInMeters = $this->height / 100;
            $bmi = $this->weight / ($heightInMeters * $heightInMeters);
            $this->bmi = round($bmi, 1);
            $this->save();
        }
    }

    public function complete()
    {
        $this->update([
            'is_draft' => false,
            'completed_at' => now()
        ]);
    }

    public function getVitalSignsAttribute()
    {
        return [
            'blood_pressure' => $this->blood_pressure,
            'temperature' => $this->temperature,
            'pulse_rate' => $this->pulse_rate,
            'respiratory_rate' => $this->respiratory_rate,
            'weight' => $this->weight,
            'height' => $this->height,
            'bmi' => $this->bmi,
            'oxygen_saturation' => $this->oxygen_saturation
        ];
    }
}