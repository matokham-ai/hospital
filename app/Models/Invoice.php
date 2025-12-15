<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'patient_id', 'total_amount',
        'discount', 'net_amount', 'paid_amount',
        'balance', 'status'
    ];

    public function encounter() { return $this->belongsTo(Encounter::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
