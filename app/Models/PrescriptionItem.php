<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrescriptionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'drug_id',
        'dose',
        'frequency',
        'duration',
        'quantity',
        'route',
        'instructions',
    ];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function drug()
    {
        return $this->belongsTo(DrugFormulary::class, 'drug_id');
    }

    public function dispensations()
    {
        return $this->hasMany(Dispensation::class);
    }
}
