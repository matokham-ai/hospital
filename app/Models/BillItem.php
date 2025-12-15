<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_account_id',
        'encounter_id',
        'item_type',
        'item_id',          // Optional reference to service_catalogue or other linked resource
        'service_code',
        'description',
        'quantity',
        'unit_price',
        'amount',
        'discount_amount',
        'net_amount',
        'status',           // e.g., pending, posted, cancelled
        'created_by',
        'reference_id',
        'reference_type',
        'posted_at'
    ];

    /**
     * Relationships
     */
    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }

    public function billingAccount()
    {
        return $this->belongsTo(BillingAccount::class, 'billing_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function service()
    {
        return $this->belongsTo(ServiceCatalogue::class, 'item_id');
    }

    // Polymorphic relationship for reference
    public function reference()
    {
        return $this->morphTo();
    }

    /**
     * Booted model events
     * Automatically update billing account totals when items are changed
     */
    protected static function booted()
    {
        static::created(function ($item) {
            if ($item->billingAccount) {
                $item->billingAccount->recalculateTotals();
            }
        });

        static::updated(function ($item) {
            if ($item->billingAccount) {
                $item->billingAccount->recalculateTotals();
            }
        });

        static::deleted(function ($item) {
            if ($item->billingAccount) {
                $item->billingAccount->recalculateTotals();
            }
        });
    }
}

