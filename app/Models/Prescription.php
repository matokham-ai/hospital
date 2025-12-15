<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prescription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'encounter_id', 'patient_id', 'physician_id',
        'drug_id', 'drug_name', 'dosage', 'frequency', 'duration',
        'quantity', 'status', 'notes', 'prescription_data',
        'instant_dispensing', 'stock_reserved', 'stock_reserved_at'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'duration' => 'integer',
        'prescription_data' => 'array',
        'instant_dispensing' => 'boolean',
        'stock_reserved' => 'boolean',
        'stock_reserved_at' => 'datetime'
    ];

    public function encounter() { return $this->belongsTo(Encounter::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
    public function physician() { return $this->belongsTo(Physician::class, 'physician_id', 'physician_code'); }
    public function dispensation() { return $this->hasOne(Dispensation::class); }
    public function items() { return $this->hasMany(PrescriptionItem::class); }

    /**
     * Get the drug formulary entry for this prescription
     * Note: This assumes prescriptions will have a drug_id field linking to drug_formulary
     * For now, this can be used when drug_id is available
     */
    public function drugFormulary()
    {
        return $this->belongsTo(DrugFormulary::class, 'drug_id');
    }

    /**
     * Check if this prescription is marked for instant dispensing
     */
    public function isInstantDispensing(): bool
    {
        return $this->instant_dispensing === true;
    }

    /**
     * Check if stock has been reserved for this prescription
     */
    public function hasStockReserved(): bool
    {
        return $this->stock_reserved === true;
    }

    /**
     * Mark this prescription for instant dispensing
     */
    public function markForInstantDispensing(): void
    {
        $this->instant_dispensing = true;
        $this->save();
    }

    /**
     * Reserve stock for this prescription
     * This should be called when instant dispensing is enabled
     */
    public function reserveStock(): void
    {
        $this->stock_reserved = true;
        $this->stock_reserved_at = now();
        $this->save();
    }

    /**
     * Release reserved stock for this prescription
     * This should be called when prescription is deleted or cancelled
     */
    public function releaseStock(): void
    {
        $this->stock_reserved = false;
        $this->stock_reserved_at = null;
        $this->save();
    }

    /**
     * Check if stock reservation has expired (older than 30 minutes)
     */
    public function isStockReservationExpired(): bool
    {
        if (!$this->stock_reserved || !$this->stock_reserved_at) {
            return false;
        }

        return $this->stock_reserved_at->diffInMinutes(now()) > 30;
    }
}
