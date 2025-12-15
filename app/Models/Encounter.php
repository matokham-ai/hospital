<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Encounter extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'encounter_number', 'type', 'status',
        'department_id', 'attending_physician_id', 'chief_complaint',
        'admission_datetime', 'discharge_datetime'
    ];

    protected $casts = [
        'admission_datetime' => 'datetime',
        'discharge_datetime' => 'datetime',
    ];

    public function patient() {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function physician() {
        return $this->belongsTo(Physician::class, 'attending_physician_id', 'physician_code');
    }

    public function department() {
        return $this->belongsTo(Department::class, 'department_id', 'deptid');
    }

    public function clinicalNotes() {
        return $this->hasMany(ClinicalNote::class);
    }

    public function diagnoses() {
        return $this->hasMany(Diagnosis::class, 'encounter_id', 'id');
    }

    public function vitalSigns() {
        return $this->hasMany(VitalSign::class);
    }

    public function bedAssignments() {
        return $this->hasMany(BedAssignment::class, 'encounter_id', 'id');
    }

    public function carePlans() {
        return $this->hasMany(CarePlan::class);
    }

    public function billingAccount() {
        return $this->hasOne(BillingAccount::class);
    }

    public function billingItems() {
        return $this->hasMany(BillItem::class);
    }

    public function labOrders() {
        return $this->hasMany(LabOrder::class);
    }

    public function medicationAdministrations() {
        return $this->hasMany(MedicationAdministration::class);
    }

}
