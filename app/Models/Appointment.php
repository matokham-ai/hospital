<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasDoctorAttribute;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory, SoftDeletes, HasDoctorAttribute;

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'appointment_number',
        'patient_id',
        'physician_id',
        'department_id',
        'appointment_slot_id',
        'appointment_type',
        'status',
        'appointment_date',
        'appointment_time',
        'chief_complaint',
        'appointment_notes',
        'encounter_id',
        'checked_in_at',
        'started_at',
        'completed_at',
        'created_by',
    ];

    /**
     * Casts
     */
    protected $casts = [
        'appointment_date' => 'date',
        'checked_in_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Boot method: generate unique appointment number automatically
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($appointment) {
            if (empty($appointment->appointment_number)) {
                $appointment->appointment_number = $appointment->generateAppointmentNumber();
            }
        });
    }

    /**
     * Generate a unique appointment number (APTYYYYMMDD###)
     */
    public function generateAppointmentNumber(): string
    {
        $date = Carbon::parse($this->appointment_date ?? today())->format('Ymd');
        $count = static::whereDate('appointment_date', $this->appointment_date ?? today())->count() + 1;
        return "APT{$date}" . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Sanitize appointment_time format
     */
    public function getAppointmentTimeAttribute($value)
    {
        if (!$value) {
            return null;
        }

        try {
            // already HH:MM:SS
            if (preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $value)) {
                return $value;
            }

            // Try to fix malformed times
            if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $value, $matches)) {
                $hour = min((int)$matches[1], 23);
                $minute = min((int)$matches[2], 59);
                $second = min((int)$matches[3], 59);
                return sprintf('%02d:%02d:%02d', $hour, $minute, $second);
            }

            return '08:00:00';
        } catch (\Exception $e) {
            \Log::warning('Invalid appointment time format', [
                'value' => $value,
                'error' => $e->getMessage(),
            ]);
            return '08:00:00';
        }
    }

    /**
     * Relationships
     */

    // 🔗 Patient: appointments.patient_id → patients.patient_id
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    // 🔗 Physician: appointments.physician_id → physicians.physician_code
    public function physician()
    {
        return $this->belongsTo(Physician::class, 'physician_id', 'physician_code');
    }

    // 🔗 Department: appointments.department_id → departments.deptid
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'deptid');
    }

    // 🔗 Appointment slot (optional)
    public function slot()
    {
        return $this->belongsTo(AppointmentSlot::class, 'appointment_slot_id', 'id');
    }

    // 🔗 Encounter (if used)
    public function encounter()
    {
        return $this->hasOne(Encounter::class, 'id', 'encounter_id');
    }

    // 🔗 Latest SOAP Note (for compatibility with OPD appointments)
    // Note: Regular appointments typically don't have SOAP notes, but this prevents errors
    public function latestSoapNote()
    {
        return $this->hasOne(OpdSoapNote::class, 'appointment_id')->latest();
    }
}
