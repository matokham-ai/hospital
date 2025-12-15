<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDoctorAttribute;
use Carbon\Carbon;

class OpdAppointment extends Model
{
   
    use HasFactory, HasDoctorAttribute;
    
    protected $fillable = [
        'appointment_number',
        'patient_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'appointment_type',
        'status',
        'triage_status',
        'triage_level',
        'triage_score',
        'pain_level',
        'red_flags',
        'chief_complaint',
        'appointment_notes',
        'queue_number',
        'checked_in_at',
        'consultation_started_at',
        'consultation_completed_at',
        'temperature',
        'blood_pressure',
        'heart_rate',
        'respiratory_rate',
        'oxygen_saturation',
        'weight',
        'height',
        'triage_notes',
        'triaged_by',
        'triaged_at'
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'checked_in_at' => 'datetime',
        'consultation_started_at' => 'datetime',
        'consultation_completed_at' => 'datetime',
        'triaged_at' => 'datetime'
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function emergencyPatient()
    {
        return $this->belongsTo(EmergencyPatient::class, 'emergency_patient_id', 'id');
    }

    public function getChiefComplaintAttribute($value)
    {
        return $value ?: $this->notes;
    }
    

    public function physician()
    {
        return $this->belongsTo(\App\Models\Physician::class, 'doctor_id', 'physician_code');
    }

    public function doctor()
    {
        return $this->physician();
    }


    public function soapNotes()
    {
        return $this->hasMany(OpdSoapNote::class, 'appointment_id');
    }

    public function diagnoses()
    {
        return $this->hasMany(OpdDiagnosis::class, 'appointment_id');
    }

    public function latestSoapNote()
    {
        return $this->hasOne(OpdSoapNote::class, 'appointment_id')->latest();
    }

    public function prescriptions()
    {
        return $this->hasMany(\App\Models\Prescription::class, 'encounter_id');
    }

    public function triagedBy()
    {
        return $this->belongsTo(User::class, 'triaged_by');
    }

    /**
     * Get the emergency record for this appointment's patient if they are an emergency patient
     * Only returns active emergency records (not discharged)
     */
    public function emergencyRecord()
    {
        return $this->hasOneThrough(
            EmergencyPatient::class,
            Patient::class,
            'id',              // Foreign key on patients table
            'patient_id',      // Foreign key on emergency_patients table
            'patient_id',      // Local key on opd_appointments table
            'id'               // Local key on patients table
        )->where('emergency_patients.status', '!=', 'discharged');
    }

    // Scopes
    public function scopeToday($query)
    {
        return $query->whereDate('appointment_date', today());
    }

    public function scopeWaiting($query)
    {
        return $query->where('status', 'WAITING');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'IN_PROGRESS');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'COMPLETED');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($appointment) {
            if (empty($appointment->appointment_number)) {
                $appointment->appointment_number = $appointment->generateAppointmentNumber();
            }
        });
    }

    // Methods
    public function generateAppointmentNumber()
    {
        $date = Carbon::parse($this->appointment_date ?? today())->format('Ymd');
        $count = static::whereDate('appointment_date', $this->appointment_date ?? today())->count() + 1;
        return "OPD{$date}" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    public function startConsultation($doctorId = null)
    {
        $this->update([
            'status' => 'IN_PROGRESS',
            'doctor_id' => $doctorId,
            'consultation_started_at' => now()
        ]);
    }

    public function completeConsultation()
    {
        $this->update([
            'status' => 'COMPLETED',
            'consultation_completed_at' => now()
        ]);
    }

    public function completeTriage($triageData, $userId)
    {
        $this->update(array_merge($triageData, [
            'triage_status' => 'completed',
            'triaged_by' => $userId,
            'triaged_at' => now()
        ]));
    }

    public function skipTriage()
    {
        $this->update([
            'triage_status' => 'skipped'
        ]);
    }

    public function getWaitingTimeAttribute()
    {
        if (!$this->checked_in_at) return 0;
        
        $endTime = $this->consultation_started_at ?? now();
        $minutes = $this->checked_in_at->diffInMinutes($endTime);
        
        // Ensure we don't return negative values
        return max(0, $minutes);
    }

    public function getConsultationDurationAttribute()
    {
        if (!$this->consultation_started_at) return 0;
        
        $endTime = $this->consultation_completed_at ?? now();
        $minutes = $this->consultation_started_at->diffInMinutes($endTime);
        
        // Ensure we don't return negative values
        return max(0, $minutes);
    }

    /**
     * Get the appointment time attribute with safe parsing
     */
    public function getAppointmentTimeAttribute($value)
    {
        if (!$value) {
            return null;
        }

        try {
            // If it's already a valid time format, return as is
            if (preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $value)) {
                return $value;
            }

            // Try to parse and fix invalid times
            if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $value, $matches)) {
                $hour = (int)$matches[1];
                $minute = (int)$matches[2];
                $second = (int)$matches[3];

                // Fix invalid hours (24+ becomes 0-23)
                if ($hour >= 24) {
                    $hour = $hour % 24;
                }

                // Fix invalid minutes/seconds
                if ($minute >= 60) {
                    $minute = 59;
                }
                if ($second >= 60) {
                    $second = 59;
                }

                return sprintf('%02d:%02d:%02d', $hour, $minute, $second);
            }

            // If all else fails, return a default time
            return '08:00:00';
        } catch (\Exception $e) {
            // Log the error and return a default time
            \Log::warning('Invalid OPD appointment time format', [
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            return '08:00:00';
        }
    }
}