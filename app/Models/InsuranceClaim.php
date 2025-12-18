<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuranceClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_account_id',
        'insurer_name',
        'policy_number',
        'claim_number',
        'claim_status',
        'claim_amount',
        'submitted_by',
        'submitted_date',
        'remarks',
    ];

    /**
     * The billing account this claim is associated with.
     */
    public function billingAccount()
    {
        return $this->belongsTo(BillingAccount::class);
    }

    /**
     * The user who submitted this insurance claim.
     */
    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
