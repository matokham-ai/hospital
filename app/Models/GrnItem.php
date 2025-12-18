<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'grn_id',
        'drug_id',
        'batch_no',
        'expiry_date',
        'quantity',
        'unit_price',
    ];

    public function grn()
    {
        return $this->belongsTo(GrnPurchase::class, 'grn_id');
    }

    public function drug()
    {
        return $this->belongsTo(Drug::class);
    }
}
