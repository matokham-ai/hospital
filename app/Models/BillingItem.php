<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id',
        'item_id',
        'item_type',
        'description',
        'quantity',
        'unit_price',
        'amount',
        'discount_amount',
        'discount_type',
        'discount_percentage',
        'discount_reason',
        'discount_approved_by',
        'net_amount',
        'service_code',
        'reference_type',
        'reference_id',
        'status',
        'posted_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function billingAccount()
    {
        return $this->belongsTo(BillingAccount::class, 'encounter_id', 'encounter_id');
    }

    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function discountApprovedBy()
    {
        return $this->belongsTo(User::class, 'discount_approved_by');
    }
}