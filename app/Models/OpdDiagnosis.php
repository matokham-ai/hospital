<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpdDiagnosis extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'soap_note_id',
        'patient_id',
        'icd10_code',
        'description',
        'type',
        'notes',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Relationships
    public function appointment()
    {
        return $this->belongsTo(OpdAppointment::class, 'appointment_id');
    }

    public function soapNote()
    {
        return $this->belongsTo(OpdSoapNote::class, 'soap_note_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function icd10()
    {
        return $this->belongsTo(Icd10Code::class, 'icd10_code', 'code');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePrimary($query)
    {
        return $query->where('type', 'PRIMARY');
    }

    public function scopeSecondary($query)
    {
        return $query->where('type', 'SECONDARY');
    }

    public function scopeComorbidity($query)
    {
        return $query->where('type', 'COMORBIDITY');
    }

    // Methods
    public function incrementIcd10Usage()
    {
        $icd10 = Icd10Code::where('code', $this->icd10_code)->first();
        if ($icd10) {
            $icd10->incrementUsage();
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($diagnosis) {
            $diagnosis->incrementIcd10Usage();
        });
    }
}