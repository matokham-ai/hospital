<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IntakeOutput extends Model
{
    use HasFactory;

    protected $table = 'intake_output';

    protected $fillable = [
        'encounter_id',
        'type',
        'category',
        'amount',
        'route',
        'notes',
        'recorded_at',
        'recorded_by',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
