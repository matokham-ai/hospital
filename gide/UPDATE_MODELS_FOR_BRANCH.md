# Models to Update for Branch Relationship

## Instructions
Add the following to each model's relationships section:

```php
public function branch()
{
    return $this->belongsTo(Branch::class);
}
```

And add `'branch_id'` to the `$fillable` array.

## Models List

### Patient Management
- ✅ `app/Models/Patient.php`

### Appointments & Consultations
- ✅ `app/Models/Appointment.php`
- ✅ `app/Models/OpdAppointment.php`
- ✅ `app/Models/Encounter.php`
- ✅ `app/Models/OpdQueue.php`

### Vitals & Triage
- ✅ `app/Models/VitalSign.php`
- ✅ `app/Models/TriageAssessment.php`

### Lab & Diagnostics
- ✅ `app/Models/LabOrder.php`
- ✅ `app/Models/LabResult.php`
- ✅ `app/Models/ImagingOrder.php`
- ✅ `app/Models/ImagingReport.php`

### Pharmacy
- ✅ `app/Models/Prescription.php`
- ✅ `app/Models/Dispensation.php`
- ✅ `app/Models/PharmacyStore.php`
- ✅ `app/Models/PharmacyStock.php`
- ✅ `app/Models/StockMovement.php`

### Billing (Already Done)
- ✅ `app/Models/Payment.php`
- ✅ `app/Models/Invoice.php`
- ✅ `app/Models/BillingAccount.php`
- ✅ `app/Models/Deposit.php`
- ✅ `app/Models/InsuranceClaim.php`
- ✅ `app/Models/LedgerEntry.php`

### Staff & Resources
- ✅ `app/Models/User.php` (Already Done)
- ✅ `app/Models/Physician.php`
- ✅ `app/Models/Department.php`
- ✅ `app/Models/Ward.php`
- ✅ `app/Models/Bed.php`
- ✅ `app/Models/BedAssignment.php`

### Emergency
- ✅ `app/Models/EmergencyPatient.php`

## Example Implementation

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
        // ... existing fields
        'branch_id',
    ];

    // ... existing relationships

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
```

## Scope Methods (Optional Enhancement)

Add to models for easy branch filtering:

```php
public function scopeForBranch($query, $branchId)
{
    return $branchId ? $query->where('branch_id', $branchId) : $query;
}
```

Usage:
```php
Patient::forBranch($branchId)->get();
```
