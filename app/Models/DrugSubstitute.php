<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DrugSubstitute extends Model
{
    use HasFactory;

    protected $fillable = [
        'drug_id', 'substitute_drug_id', 'substitution_type', 'notes'
    ];

    protected $casts = [
        'substitution_type' => 'string',
    ];

    // Relationships
    public function drug()
    {
        return $this->belongsTo(DrugFormulary::class, 'drug_id');
    }

    public function substituteDrug()
    {
        return $this->belongsTo(DrugFormulary::class, 'substitute_drug_id');
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'drug_id' => 'required|exists:drug_formulary,id',
            'substitute_drug_id' => 'required|exists:drug_formulary,id|different:drug_id',
            'substitution_type' => 'required|in:generic,therapeutic,brand',
            'notes' => 'nullable|string',
        ];
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('substitution_type', $type);
    }

    public function scopeForDrug($query, $drugId)
    {
        return $query->where('drug_id', $drugId);
    }
}
