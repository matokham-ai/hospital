# Branch Dashboard Query Fixes

## Issues Fixed

### 1. Patient Status Column
**Error**: `Column not found: 1054 Unknown column 'status' in 'where clause'`

**Problem**: Patient model doesn't have a `status` column

**Solution**: 
- Changed "active patients" to count patients with recent encounters (last 6 months)
- This provides a more meaningful metric of patient activity

```php
// Before
'active' => Patient::where('branch_id', $branch->id)
    ->where('status', 'active')
    ->count(),

// After
'active' => Patient::where('branch_id', $branch->id)
    ->whereHas('encounters', function($q) {
        $q->where('created_at', '>=', now()->subMonths(6));
    })
    ->count(),
```

### 2. User Last Login Column
**Problem**: User model doesn't have `last_login_at` column

**Solution**: Use `updated_at` as a proxy for user activity

```php
// Before
'active_today' => User::where('branch_id', $branch->id)
    ->whereDate('last_login_at', today())
    ->count(),

// After
'active_today' => User::where('branch_id', $branch->id)
    ->whereDate('updated_at', today())
    ->count(),
```

### 3. Encounter Branch Relationship
**Problem**: Encounter model doesn't have `branch_id` column

**Solution**: Query through Patient relationship instead

```php
// Before
Prescription::whereHas('encounter', function($q) use ($branch) {
    $q->where('branch_id', $branch->id);
})

// After
Prescription::whereHas('patient', function($q) use ($branch) {
    $q->where('branch_id', $branch->id);
})
```

### 4. Lab Test Model
**Problem**: Used non-existent `TestOrder` model

**Solution**: Use correct `LabOrder` model with nested relationship

```php
LabOrder::whereHas('encounter.patient', function($q) use ($branch) {
    $q->where('branch_id', $branch->id);
})
```

### 5. Drug Stock Columns
**Problem**: Drug model doesn't have `quantity` or `reorder_level` columns

**Solution**: Set to 0 for now (can be implemented later with PharmacyStock model)

```php
'low_stock_items' => 0, // To be implemented with PharmacyStock
```

## Updated Statistics

### Patient Statistics
- **Total**: All patients registered to branch
- **Active**: Patients with encounters in last 6 months
- **New This Month**: Patients created this month
- **Growth Rate**: Month-over-month patient growth

### Staff Statistics
- **Total**: All users assigned to branch
- **Doctors**: Users with doctor role
- **Nurses**: Users with nurse role
- **Active Today**: Users with activity today (updated_at)

### Pharmacy Statistics
- **Prescriptions Today**: Via patient relationship
- **Prescriptions Month**: Via patient relationship
- **Low Stock Items**: Placeholder (0)

### Laboratory Statistics
- **Tests Today**: Via encounter.patient relationship
- **Tests Pending**: Via encounter.patient relationship
- **Tests Completed**: Via encounter.patient relationship

## Database Schema Notes

### Current Branch Relationships
- ✅ `patients.branch_id` - Direct relationship
- ✅ `users.branch_id` - Direct relationship
- ✅ `appointments.branch_id` - Direct relationship
- ✅ `payments.branch_id` - Direct relationship
- ✅ `invoices.branch_id` - Direct relationship
- ❌ `encounters.branch_id` - Not present (use patient relationship)
- ❌ `prescriptions.branch_id` - Not present (use patient relationship)
- ❌ `lab_orders.branch_id` - Not present (use encounter.patient relationship)

### Recommendations for Future
1. Consider adding `branch_id` to `encounters` table for direct queries
2. Implement `last_login_at` tracking in users table
3. Create PharmacyStock model with quantity/reorder_level for inventory tracking
4. Add indexes on branch_id columns for better query performance
