<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispensation extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id', 'dispensed_by', 'quantity_dispensed',
        'dispensed_at', 'batch_no', 'expiry_date'
    ];

    public function prescription() { return $this->belongsTo(Prescription::class); }
    public function user() { return $this->belongsTo(User::class, 'dispensed_by'); }
}
