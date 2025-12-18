<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TriageAssessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'emergency_patient_id', 'triage_category', 'temperature', 'blood_pressure',
        'heart_rate', 'respiratory_rate', 'oxygen_saturation',
        'gcs_eye', 'gcs_verbal', 'gcs_motor', 'gcs_total',
        'assessment_notes', 'assessed_by', 'assessed_at'
    ];

    protected $casts = [
        'assessed_at' => 'datetime',
    ];

    public function emergencyPatient()
    {
        return $this->belongsTo(EmergencyPatient::class);
    }

    public function assessor()
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }

    public function calculateGcsTotal()
    {
        return ($this->gcs_eye ?? 0) + ($this->gcs_verbal ?? 0) + ($this->gcs_motor ?? 0);
    }
}
