<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'physician_code', 'department_id', 'slot_date',
        'start_time', 'end_time', 'duration_minutes',
        'max_appointments', 'is_available', 'notes'
    ];

    public function physician() { return $this->belongsTo(Physician::class, 'physician_code', 'physician_code'); }
    public function department() { return $this->belongsTo(Department::class, 'department_id'); }
}
