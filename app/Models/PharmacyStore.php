<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyStore extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'location', 'is_active'];

    public function stock()
    {
        return $this->hasMany(PharmacyStock::class, 'store_id');
    }
}
