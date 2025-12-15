<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmergencyPatient extends Model
{
    use HasFactory;
    protected $fillable = [
        'patient_id', 'temp_name', 'temp_contact', 'gender', 'age',
        'chief_complaint', 'history_of_present_illness', 'arrival_mode',
        'arrival_time', 'status', 'assigned_to'
    ];

    protected $casts = [
        'arrival_time' => 'datetime',
    ];
    protected $with = ['assignedDoctor'];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function triageAssessments()
    {
        return $this->hasMany(TriageAssessment::class);
    }

    public function latestTriage()
    {
        return $this->hasOne(TriageAssessment::class)->latestOfMany();
    }

    public function orders()
    {
        return $this->hasMany(EmergencyOrder::class);
    }

    public function assignedDoctor()
    {
        return $this->belongsTo(Physician::class, 'assigned_to', 'physician_code');
    }
}
