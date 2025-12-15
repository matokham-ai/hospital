<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'address_type', 'address_line1', 'address_line2',
        'village', 'town_city', 'sub_county', 'county', 'state_province',
        'postal_code', 'country', 'is_primary'
    ];

    public function patient() { return $this->belongsTo(Patient::class); }
}
