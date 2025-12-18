<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingAccount extends Model
{
    use HasFactory;

    public const STATUS_OPEN = 'open';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'account_no',
        'patient_id',
        'encounter_id',
        'status',
        'total_amount',
        'discount_amount',
        'discount_type',
        'discount_percentage',
        'discount_reason',
        'discount_approved_by',
        'discount_approved_at',
        'net_amount',
        'amount_paid',
        'balance',
        'created_by',
        'closed_at',
        'branch_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance' => 'decimal:2',
        'closed_at' => 'datetime',
        'discount_approved_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }

    public function items()
    {
        return $this->hasMany(BillingItem::class, 'encounter_id', 'encounter_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function discountApprovedBy()
    {
        return $this->belongsTo(User::class, 'discount_approved_by');
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->created_by = $model->created_by ?? auth()->id() ?? 1;
        });
    }
    
}