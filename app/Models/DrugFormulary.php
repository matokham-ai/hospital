<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class DrugFormulary extends Model
{
    use HasFactory;

    protected $table = 'drug_formulary';

    protected $fillable = [
        'name', 'generic_name', 'brand_name', 'atc_code', 'therapeutic_class',
        'strength', 'form', 'formulation', 'dosage_form_details',
        'stock_quantity', 'reorder_level', 'unit_price', 'cost_price',
        'manufacturer', 'batch_number', 'expiry_date', 'storage_conditions',
        'status', 'requires_prescription', 'notes', 'contraindications',
        'side_effects', 'created_by', 'updated_by'
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'expiry_date' => 'date',
        'requires_prescription' => 'boolean',
        'contraindications' => 'array',
        'side_effects' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'stock_status',
        'stock_badge_color',
        'formatted_price',
        'formatted_cost_price',
        'profit_margin',
        'days_to_expiry',
        'is_expired',
        'is_near_expiry'
    ];

    // Relationships
    public function prescriptionItems()
    {
        return $this->hasMany(PrescriptionItem::class, 'drug_id');
    }

    public function pharmacyStocks()
    {
        return $this->hasMany(PharmacyStock::class, 'drug_id');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'drug_id');
    }

    public function grnItems()
    {
        return $this->hasMany(GrnItem::class, 'drug_id');
    }

    public function dispensations()
    {
        return $this->hasManyThrough(Dispensation::class, PrescriptionItem::class, 'drug_id', 'prescription_item_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'reorder_level');
    }

    public function scopeByForm($query, $form)
    {
        return $query->where('form', $form);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('generic_name', 'like', "%{$search}%")
              ->orWhere('atc_code', 'like', "%{$search}%");
        });
    }

    // Validation rules
    public static function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'generic_name' => 'required|string|max:255',
            'brand_name' => 'nullable|string|max:200',
            'atc_code' => 'nullable|string|max:20|regex:/^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$/',
            'therapeutic_class' => 'nullable|string|max:100',
            'strength' => 'required|string|max:100',
            'form' => 'required|in:tablet,capsule,syrup,injection,cream,ointment,drops,inhaler,other',
            'formulation' => 'nullable|string|max:100',
            'dosage_form_details' => 'nullable|string|max:200',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'manufacturer' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date|after:today',
            'storage_conditions' => 'nullable|string|max:100',
            'status' => 'in:active,discontinued',
            'requires_prescription' => 'boolean',
            'notes' => 'nullable|string',
            'contraindications' => 'nullable|array',
            'side_effects' => 'nullable|array',
        ];
    }

    // Accessors
    public function getStockStatusAttribute()
    {
        if ($this->stock_quantity <= 0) {
            return 'out_of_stock';
        } elseif ($this->stock_quantity <= $this->reorder_level) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    public function getStockBadgeColorAttribute()
    {
        return match($this->stock_status) {
            'in_stock' => 'green',
            'low_stock' => 'yellow',
            'out_of_stock' => 'red',
            default => 'gray'
        };
    }

    public function getFormattedPriceAttribute()
    {
        return 'KES ' . number_format($this->unit_price, 2);
    }

    public function getFormattedCostPriceAttribute()
    {
        return $this->cost_price ? 'KES ' . number_format($this->cost_price, 2) : null;
    }

    public function getProfitMarginAttribute()
    {
        if (!$this->cost_price || $this->cost_price <= 0) {
            return null;
        }
        
        $profit = $this->unit_price - $this->cost_price;
        return round(($profit / $this->cost_price) * 100, 2);
    }

    public function getDaysToExpiryAttribute()
    {
        if (!$this->expiry_date) {
            return null;
        }
        
        return Carbon::now()->diffInDays($this->expiry_date, false);
    }

    public function getIsExpiredAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        
        return $this->expiry_date->isPast();
    }

    public function getIsNearExpiryAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        
        // Consider near expiry if within 90 days
        return $this->days_to_expiry !== null && $this->days_to_expiry <= 90 && $this->days_to_expiry > 0;
    }

    public function getFullNameAttribute()
    {
        $parts = array_filter([
            $this->name,
            $this->strength,
            $this->form,
            $this->formulation
        ]);
        
        return implode(' ', $parts);
    }

    // Business logic methods
    public function isLowStock()
    {
        return $this->stock_quantity <= $this->reorder_level;
    }

    public function isOutOfStock()
    {
        return $this->stock_quantity <= 0;
    }

    public function updateStock($quantity, $operation = 'subtract')
    {
        if ($operation === 'add') {
            $this->increment('stock_quantity', $quantity);
        } else {
            $this->decrement('stock_quantity', $quantity);
        }
    }

    public function getTotalStockValue()
    {
        return $this->stock_quantity * $this->unit_price;
    }

    public function getTotalCostValue()
    {
        if (!$this->cost_price) {
            return null;
        }
        
        return $this->stock_quantity * $this->cost_price;
    }
}
