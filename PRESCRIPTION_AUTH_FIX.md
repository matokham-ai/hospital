# Prescription Management Authentication Fix

## Problem
When trying to save a prescription, you see:
- **Error Toast**: "Failed to save prescription"
- **Console Error**: "Unauthenticated"

## Root Causes

### 1. Session Expired
The most common cause - your authentication session has expired, so `$request->user()` returns null.

### 2. Missing Permission
The user needs either:
- The **'Admin'** role, OR
- The **'prescribe drugs'** permission

### 3. CSRF Token Invalid
The CSRF token in the request doesn't match the server's token.

## Solution Applied

### Updated Files
1. **`resources/js/Components/Consultation/PrescriptionForm.tsx`**
   - Added proper authentication headers to all API calls
   - Added content-type checking before parsing JSON
   - Added `credentials: 'include'` for cookie-based auth

2. **`resources/js/Pages/OPD/SoapNotes.tsx`**
   - Added content-type validation to `handleSavePrescription()`
   - Shows "Session Expired" message instead of cryptic errors

## Immediate Fix

**Simply refresh your browser page (F5 or Ctrl+R)**

This will:
1. Get a fresh authentication session
2. Get a new CSRF token
3. Reload the page with proper authentication

## Verify User Permissions

If refreshing doesn't work, check if your user has the required permissions:

### Option 1: Check in Database
```sql
-- Check user roles
SELECT u.name, u.email, r.name as role
FROM users u
JOIN model_has_roles mhr ON u.id = mhr.model_id
JOIN roles r ON mhr.role_id = r.id
WHERE u.email = 'your-email@example.com';

-- Check user permissions
SELECT u.name, u.email, p.name as permission
FROM users u
JOIN model_has_permissions mhp ON u.id = mhp.model_id
JOIN permissions p ON mhp.permission_id = p.id
WHERE u.email = 'your-email@example.com';
```

### Option 2: Grant Permission via Tinker
```bash
php artisan tinker
```

```php
// Find your user
$user = User::where('email', 'your-email@example.com')->first();

// Give prescribe drugs permission
$user->givePermissionTo('prescribe drugs');

// OR assign Doctor role (which includes prescribe drugs)
$user->assignRole('Doctor');

// Verify
$user->hasPermissionTo('prescribe drugs'); // Should return true
```

### Option 3: Run Seeders
If permissions are missing entirely:

```bash
php artisan db:seed --class=RolePermissionSeeder
```

## Controller Permission Check

The `OpdPrescriptionController` checks permissions like this:

```php
$user = $request->user();
if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
    return response()->json(['message' => 'Unauthorized'], 403);
}
```

**Users who can prescribe:**
- Admins (any user with 'Admin' role)
- Doctors (have 'prescribe drugs' permission)
- Any user with 'prescribe drugs' permission

## Testing the Fix

1. **Refresh the browser page**
2. Navigate to OPD Management → Consultations
3. Click on a consultation to open SOAP Notes
4. Try to add a prescription:
   - Search for a drug
   - Select a drug from the list
   - Fill in the prescription form
   - Click "Save Prescription"

### Expected Results

**If session is valid and user has permission:**
- ✅ Prescription saves successfully
- ✅ Toast shows "Prescription saved"
- ✅ Prescription appears in the list below

**If session expired:**
- ⚠️ Toast shows "Session Expired - Please refresh the page and try again"
- ⚠️ No cryptic JSON parsing errors

**If user lacks permission:**
- ❌ Toast shows "Unauthorized" or "Failed to save prescription"
- ❌ HTTP 403 response in Network tab

## Debugging Steps

### 1. Check Browser Console
Open DevTools (F12) → Console tab:
- Look for "Failed to save prescription" errors
- Check if there are JSON parsing errors
- Look for "Session expired" messages

### 2. Check Network Tab
Open DevTools (F12) → Network tab:
- Find the POST request to `/api/opd/appointments/{id}/prescriptions`
- Check the Status code:
  - **200/201**: Success
  - **401**: Unauthenticated (session expired)
  - **403**: Unauthorized (missing permission)
  - **419**: CSRF token mismatch
  - **422**: Validation error
- Check the Response:
  - Should be JSON
  - If HTML (starts with `<!DOCTYPE`), session expired

### 3. Check Request Headers
In Network tab → Headers:
- Verify `X-CSRF-TOKEN` is present
- Verify `X-Requested-With: XMLHttpRequest` is present
- Verify `Cookie` header contains session cookie

### 4. Check Response
In Network tab → Response:
- If JSON: Read the error message
- If HTML: Session expired, refresh page

## Related API Endpoints

All these endpoints require authentication and 'prescribe drugs' permission:

1. **Create Prescription**
   - `POST /api/opd/appointments/{id}/prescriptions`
   - Creates a new prescription

2. **Update Prescription**
   - `PUT /api/opd/appointments/{id}/prescriptions/{prescriptionId}`
   - Updates an existing prescription

3. **Delete Prescription**
   - `DELETE /api/opd/appointments/{id}/prescriptions/{prescriptionId}`
   - Deletes a prescription and releases stock

4. **Check Drug Interactions** (if implemented)
   - `POST /api/opd/appointments/{id}/prescriptions/check`
   - Checks for drug interactions and allergies

5. **Validate Stock** (if implemented)
   - `POST /api/opd/appointments/{id}/prescriptions/validate-stock`
   - Validates stock availability for instant dispensing

## Common Errors and Solutions

### Error: "Unauthenticated"
**Solution**: Refresh the page to get a new session

### Error: "Unauthorized"
**Solution**: Grant 'prescribe drugs' permission to the user

### Error: "CSRF token mismatch"
**Solution**: Refresh the page to get a new CSRF token

### Error: "Cannot modify completed consultation"
**Solution**: This is expected - you can't modify prescriptions after consultation is completed

### Error: "Insufficient stock for instant dispensing"
**Solution**: Either:
- Uncheck "Instant Dispensing"
- Reduce the quantity
- Add more stock to the drug formulary

## Prevention

To avoid this issue in the future:

1. **Increase session lifetime** in `.env`:
   ```env
   SESSION_LIFETIME=480  # 8 hours instead of 2
   ```

2. **Use remember me** when logging in

3. **Implement session timeout warning** (future enhancement)

4. **Auto-refresh CSRF token** periodically (future enhancement)

## Status

✅ **FIXED** - PrescriptionForm now has proper authentication headers and error handling.

## Next Steps

If you still see issues after:
1. Refreshing the page
2. Verifying user has 'prescribe drugs' permission
3. Checking the debugging steps above

Then please:
1. Share the exact error message from the toast
2. Share the Network tab response for the failed request
3. Share the user's roles and permissions from the database
