<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Drug extends Model
{
    use HasFactory;

    protected $table = 'drug_formulary';

    protected $fillable = [
        'name',
        'generic_name',
        'brand_name',
        'atc_code',
        'therapeutic_class',
        'strength',
        'form',
        'formulation',
        'dosage_form_details',
        'stock_quantity',
        'reorder_level',
        'unit_price',
        'cost_price',
        'manufacturer',
        'batch_number',
        'expiry_date',
        'storage_conditions',
        'status',
        'requires_prescription',
        'notes',
        'contraindications',
        'side_effects',
        'created_by',
        'updated_by',
        'is_active',
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'expiry_date' => 'date',
        'requires_prescription' => 'boolean',
        'is_active' => 'boolean',
        'contraindications' => 'array',
        'side_effects' => 'array',
    ];

    // Substitutes
    public function substitutes()
    {
        return $this->belongsToMany(
            Drug::class,
            'drug_substitutes',
            'drug_id',
            'substitute_id'
        );
    }

    // Interactions
    public function interactions()
    {
        return $this->belongsToMany(
            Drug::class,
            'drug_interactions',
            'drug_a_id',
            'drug_b_id'
        )->withPivot('severity', 'description');
    }

    // Stock
    public function stocks()
    {
        return $this->hasMany(PharmacyStock::class);
    }

    // Prescription items
    public function prescriptionItems()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
