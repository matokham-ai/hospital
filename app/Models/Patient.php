<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'hospital_id', 'first_name', 'last_name', 'middle_name',
        'phone', 'email', 'date_of_birth', 'gender', 'marital_status', 
        'occupation', 'nationality', 'religion', 'insurance_info', 
        'allergies', 'chronic_conditions', 'alerts'
    ];

    protected $casts = [
        'insurance_info' => 'array',
        'allergies' => 'array',
        'chronic_conditions' => 'array',
        'alerts' => 'array',
    ];

    protected $appends = ['name', 'age'];

    public function addresses() 
    { 
        return $this->hasMany(PatientAddress::class, 'patient_id'); 
    }
    
    public function contacts() 
    { 
        return $this->hasMany(PatientContact::class, 'patient_id'); 
    }
    
    public function encounters() 
    {
        return $this->hasMany(Encounter::class, 'patient_id', 'id');
    }

    public function latestEncounter() 
    {
        return $this->hasOne(Encounter::class, 'patient_id', 'id')->latestOfMany();
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id', 'id');
    }

    public function patientAlerts()
    {
        return $this->hasMany(Alert::class, 'patient_id', 'id');
    }

    // Accessor for full name
    public function getNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    // Accessor for age
    public function getAgeAttribute()
    {
        if (!$this->date_of_birth) {
            return null;
        }

        try {
            $dob = \Carbon\Carbon::parse($this->date_of_birth);
            return $dob->age;
        } catch (\Exception $e) {
            return null;
        }
    }
}
