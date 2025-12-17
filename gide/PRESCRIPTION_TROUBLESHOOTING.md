# Prescription Save Not Working - Troubleshooting Guide

## 🚨 QUICK FIX FOR "Unauthenticated" ERROR (UPDATED)

**If you see "Failed to save prescription" and "Unauthenticated":**

### Immediate Solution
1. **Refresh the page** (F5 or Ctrl+R) - This fixes 90% of cases
2. Try saving the prescription again

### If Still Failing - Grant Permission
```bash
php artisan tinker
```
```php
$user = User::where('email', 'YOUR_EMAIL@example.com')->first();
$user->givePermissionTo('prescribe drugs');
exit
```

### What Was Fixed
- ✅ Added proper authentication headers to all API calls
- ✅ Added content-type checking before parsing JSON
- ✅ Better error messages for session expiration
- ✅ Files updated: `PrescriptionForm.tsx`, `SoapNotes.tsx`

See `PRESCRIPTION_QUICK_FIX.md` and `PRESCRIPTION_AUTH_FIX.md` for complete details.

---

## Step 1: Check Browser Console for Errors

1. Open browser console (F12)
2. Go to Console tab
3. Try to save a prescription
4. Look for error messages

### Common Errors and Solutions:

#### Error: "Unauthorized" or 403
**Cause**: User doesn't have permission to prescribe
**Solution**:
```sql
-- Check user role
SELECT id, name, email, role FROM users WHERE id = YOUR_USER_ID;

-- If role is not Admin or Doctor, update it
UPDATE users SET role = 'Doctor' WHERE id = YOUR_USER_ID;
```

#### Error: "drug_id is required" or validation error
**Cause**: Drug not being sent properly from form
**Solution**: Check if drug is selected before clicking save

#### Error: "Cannot find drug_formulary table"
**Cause**: Table name mismatch
**Solution**:
```sql
-- Check if table exists
SHOW TABLES LIKE '%drug%';

-- Should show: drug_formulary
```

#### Error: "Unauthenticated"
**Cause**: Session expired or CSRF token invalid
**Solution**:
1. Log out and log back in
2. Hard refresh (Ctrl+Shift+R)
3. Clear browser cookies

## Step 2: Check if Drugs Exist in Database

```sql
-- Check drug count
SELECT COUNT(*) as total_drugs FROM drug_formulary;

-- If 0, you need to add drugs
-- Check first 5 drugs
SELECT id, name, generic_name, strength, form, unit_price 
FROM drug_formulary 
LIMIT 5;
```

### If No Drugs Exist:

You need to add drugs to the formulary. Go to:
**Admin → Drug Formulary** and add some drugs manually, or use the Drug Wizard.

## Step 3: Check API Endpoint

Test the API directly:

```bash
# Test if endpoint exists
php artisan route:list | findstr "prescriptions"

# Should show:
# POST api/opd/appointments/{id}/prescriptions
```

## Step 4: Check Laravel Logs

```bash
# View last 50 lines of log
Get-Content storage/logs/laravel.log -Tail 50
```

Look for errors related to prescriptions.

## Step 5: Test Prescription Save Manually

Open browser console and run:

```javascript
// Get CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Test prescription save
fetch('/api/opd/appointments/1/prescriptions', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': csrfToken,
    'X-Requested-With': 'XMLHttpRequest',
  },
  body: JSON.stringify({
    drug_id: 1,  // Use actual drug ID from your database
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: 7,
    quantity: 14,
    instant_dispensing: false
  })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

## Step 6: Common Issues and Fixes

### Issue: Drug search shows no results

**Check**:
```sql
SELECT COUNT(*) FROM drug_formulary WHERE status = 'active';
```

**Fix**: Add drugs or change status to 'active'
```sql
UPDATE drug_formulary SET status = 'active' WHERE status IS NULL;
```

### Issue: Form doesn't appear after selecting drug

**Check**: Browser console for JavaScript errors

**Fix**: 
1. Clear browser cache
2. Rebuild assets: `npm run build`
3. Hard refresh

### Issue: "instant_dispensing" validation error

**Cause**: Trying to use instant dispensing for non-emergency patient

**Fix**: Uncheck "Instant Dispensing" checkbox or ensure patient is emergency patient

### Issue: "physician_id" is null

**Cause**: Appointment doesn't have assigned doctor

**Fix**:
```sql
-- Check appointment
SELECT id, appointment_number, doctor_id, patient_id 
FROM opd_appointments 
WHERE id = YOUR_APPOINTMENT_ID;

-- If doctor_id is NULL, assign one
UPDATE opd_appointments 
SET doctor_id = 'DOC001'  -- Use actual physician code
WHERE id = YOUR_APPOINTMENT_ID;
```

## Step 7: Verify Database Schema

```sql
-- Check prescriptions table structure
DESCRIBE prescriptions;

-- Should have these columns:
-- id, encounter_id, patient_id, physician_id, drug_id, drug_name
-- dosage, frequency, duration, quantity, status, instant_dispensing
```

## Step 8: Check PrescriptionService

```bash
# Check if service exists
php artisan tinker --execute="echo class_exists('App\\Services\\PrescriptionService') ? 'EXISTS' : 'MISSING';"
```

If MISSING, the service file might be missing or not autoloaded.

## Step 9: Network Tab Analysis

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to save prescription
4. Look for the POST request to `/api/opd/appointments/{id}/prescriptions`
5. Check:
   - Status code (should be 201 for success)
   - Request payload (what data was sent)
   - Response (what error was returned)

## Step 10: Quick Fixes to Try

### Fix 1: Clear All Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Fix 2: Rebuild Frontend
```bash
npm run build
```

### Fix 3: Check Permissions
```sql
-- Give user admin role temporarily for testing
UPDATE users SET role = 'Admin' WHERE email = 'your@email.com';
```

### Fix 4: Check CSRF Token
In browser console:
```javascript
console.log(document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'));
// Should show a long token string
// If null, CSRF token is missing from page
```

## Expected Successful Response

When prescription saves successfully, you should see:

**Status**: 201 Created

**Response**:
```json
{
  "message": "Prescription created successfully",
  "data": {
    "id": 1,
    "encounter_id": 1,
    "patient_id": 1,
    "physician_id": "DOC001",
    "drug_id": 1,
    "drug_name": "Paracetamol 500mg",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "duration": 7,
    "quantity": 14,
    "status": "pending",
    "instant_dispensing": false,
    "created_at": "2024-12-05T10:00:00.000000Z",
    "updated_at": "2024-12-05T10:00:00.000000Z"
  }
}
```

## Still Not Working?

If none of the above works, provide me with:

1. **Browser console error** (exact error message)
2. **Network tab response** (status code and response body)
3. **Laravel log error** (from `storage/logs/laravel.log`)
4. **User role** (from database)
5. **Drug count** (how many drugs in drug_formulary table)

With this information, I can provide a specific fix for your issue.

## Quick Test Checklist

- [ ] User is logged in
- [ ] User has Doctor or Admin role
- [ ] Drugs exist in drug_formulary table
- [ ] Drug search shows results
- [ ] Can select a drug from search
- [ ] Prescription form appears
- [ ] All required fields filled (dosage, frequency, duration, quantity)
- [ ] CSRF token present in page
- [ ] No JavaScript errors in console
- [ ] API route exists (check with `php artisan route:list`)
- [ ] Laravel logs show no errors

---

**Most Common Issue**: No drugs in database or user doesn't have permission to prescribe.

**Quick Fix**: 
1. Make user Admin: `UPDATE users SET role = 'Admin' WHERE id = YOUR_ID;`
2. Add a test drug via Admin → Drug Formulary
3. Try again
