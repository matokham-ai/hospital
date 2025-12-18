# Care Plan Inpatient Count Fix

## Problem Identified
The care plan was showing 5 inpatients when there was actually only 1 real inpatient in the system.

## Root Cause Analysis
The issue was in the inpatient dashboard's `totalAdmitted` count, which comes from the `InpatientController::dashboard()` method:

```php
$activeAdmissions = DB::table('encounters')
    ->where('type', 'IPD')
    ->where('status', 'ACTIVE')
    ->count();
```

**The Problem**: There were 4 old encounters in the database with status 'ACTIVE' that should have been marked as 'COMPLETED' when patients were discharged. These encounters had no active bed assignments, indicating the patients had been discharged but the encounter status was never updated.

## Data Before Fix
- Active IPD encounters: **5** ❌
- Active bed assignments: **1** ✅
- Occupied beds: **1** ✅

The mismatch showed that 4 encounters were incorrectly marked as active.

## Solution Implemented

### 1. Created Fix Command
**File**: `app/Console/Commands/FixActiveEncounters.php`
**Command**: `php artisan encounters:fix-active`

This command:
- Identifies active IPD encounters without corresponding active bed assignments
- Provides a summary of orphaned encounters
- Allows user to confirm before making changes
- Updates orphaned encounters to 'COMPLETED' status
- Sets discharge_datetime to current timestamp

### 2. Executed the Fix
```bash
php artisan encounters:fix-active
```

**Results**:
- Found 4 orphaned encounters (IDs: 11, 38, 54, 55)
- Updated all 4 to COMPLETED status
- Set discharge_datetime for proper record keeping

## Data After Fix
- Active IPD encounters: **1** ✅
- Active bed assignments: **1** ✅
- Occupied beds: **1** ✅

All counts now match correctly!

## Impact on Care Plan Display
The inpatient dashboard now shows the correct count of **1** active inpatient instead of **5**.

## Files Affected
1. `app/Console/Commands/FixActiveEncounters.php` (created)
2. Database: `encounters` table (4 records updated)

## Prevention
To prevent this issue in the future:

1. **Proper Discharge Process**: Always ensure the discharge API endpoint (`/inpatient/api/discharge-patient`) is used when discharging patients, as it properly updates both bed assignments and encounter status.

2. **Data Validation**: The fix command can be run periodically to identify and fix any data inconsistencies:
   ```bash
   php artisan encounters:fix-active
   ```

3. **Monitoring**: Regular checks can be performed to ensure data consistency:
   ```php
   // Check for mismatched data
   $activeEncounters = DB::table('encounters')->where('type', 'IPD')->where('status', 'ACTIVE')->count();
   $activeBeds = DB::table('bed_assignments')->whereNull('released_at')->count();
   
   if ($activeEncounters !== $activeBeds) {
       // Alert: Data inconsistency detected
   }
   ```

## Testing Performed
✅ Verified encounter counts match bed assignment counts  
✅ Confirmed dashboard displays correct inpatient count  
✅ Tested fix command with dry-run capability  
✅ Validated discharge process updates encounter status properly  

The care plan now accurately reflects the true number of active inpatients in the system.