<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id',
        'amount',
        'mode',
        'reference_no',
        'deposit_date',
        'received_by',
        'remarks',
    ];

    /**
     * The inpatient encounter this deposit belongs to.
     */
    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }

    /**
     * The user (cashier) who received the deposit.
     */
    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
