<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'drug_id',
        'source_store_id',
        'dest_store_id',
        'movement_type',
        'quantity',
        'reference_no',
        'user_id',
        'remarks',
    ];

    public function drug()
    {
        return $this->belongsTo(Drug::class);
    }

    public function sourceStore()
    {
        return $this->belongsTo(PharmacyStore::class, 'source_store_id');
    }

    public function destStore()
    {
        return $this->belongsTo(PharmacyStore::class, 'dest_store_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
