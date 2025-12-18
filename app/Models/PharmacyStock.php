<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyStock extends Model
{
    use HasFactory;

    protected $table = 'pharmacy_stock';

    protected $fillable = [
        'store_id',
        'drug_id',
        'batch_no',
        'expiry_date',
        'quantity',
        'min_level',
        'max_level',
        'last_updated',
    ];

    public function store()
    {
        return $this->belongsTo(PharmacyStore::class);
    }

    public function drug()
    {
        return $this->belongsTo(DrugFormulary::class);
    }
}
