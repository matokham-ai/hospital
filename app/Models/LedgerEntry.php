<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_date',
        'account_head',
        'debit',
        'credit',
        'narration',
        'billing_account_id',
        'created_by',
    ];

    /**
     * The billing account (if linked) for this ledger entry.
     */
    public function billingAccount()
    {
        return $this->belongsTo(BillingAccount::class);
    }

    /**
     * The user who created this ledger entry.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Compute the net amount (credit - debit).
     */
    public function getNetAmountAttribute()
    {
        return $this->credit - $this->debit;
    }
}
