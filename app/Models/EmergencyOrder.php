<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyOrder extends Model
{
    protected $fillable = [
        'emergency_patient_id', 'order_type', 'order_name', 'order_details',
        'priority', 'status', 'ordered_by', 'completed_by',
        'ordered_at', 'completed_at', 'results'
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function emergencyPatient()
    {
        return $this->belongsTo(EmergencyPatient::class);
    }

    public function orderedBy()
    {
        return $this->belongsTo(User::class, 'ordered_by');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
