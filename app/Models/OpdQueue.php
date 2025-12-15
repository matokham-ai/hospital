<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpdQueue extends Model
{
    use HasFactory;

    protected $table = 'opd_queue';

    protected $fillable = [
        'appointment_id', 'patient_id', 'physician_id', 'department_id',
        'queue_type', 'status', 'queue_number', 'priority',
        'queued_at', 'called_at', 'started_at', 'completed_at', 'notes'
    ];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function physician() { return $this->belongsTo(Physician::class, 'physician_id'); }
    public function department() { return $this->belongsTo(Department::class, 'department_id'); }
}
