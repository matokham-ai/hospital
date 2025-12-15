<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'amount',
        'method',
        'reference_no',
        'payment_date',
        'notes',
        'receipt_path',
        'status',
        'created_by',
        'received_by',
        'billing_account_id',
        'branch_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function getFormattedAmountAttribute(): string
    {
        return 'KSh ' . number_format($this->amount, 2);
    }

    public function getMethodLabelAttribute(): string
    {
        return match($this->method) {
            'cash' => 'Cash',
            'card' => 'Card',
            'mpesa' => 'M-Pesa',
            'bank' => 'Bank Transfer',
            default => ucfirst($this->method)
        };
    }
}