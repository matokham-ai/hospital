# Consultation API Authentication Fix - Complete

## Issues Fixed

### 1. Lab Test Search Errors
**Error Messages:**
```
Failed to load test categories: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Failed to load tests: SyntaxError: Unexpected token '<'
```

**Root Cause:** API endpoints were returning HTML (login page) instead of JSON when authentication failed.

### 2. Prescription Save Errors
**Error Messages:**
```
Failed to save prescription
Unauthenticated
```

**Root Cause:** Session expired or CSRF token invalid, causing authentication failures.

## Changes Made

### 1. LabTestSearch Component (`resources/js/Components/Consultation/LabTestSearch.tsx`)

**Updated API Calls:**
- Added CSRF token to headers
- Added `X-Requested-With: XMLHttpRequest` header
- Changed `credentials` from `"same-origin"` to `"include"`
- Added better error logging

**Affected Functions:**
- `loadCategories()` - Loads test categories
- `loadTests()` - Searches for tests

### 2. SoapNotes Component (`resources/js/Pages/OPD/SoapNotes.tsx`)

**Added Content-Type Validation:**
Before parsing JSON responses, now checks if the response is actually JSON:

```typescript
const contentType = response.headers.get("content-type");
if (!contentType || !contentType.includes("application/json")) {
  toast({
    title: "Session Expired",
    description: "Your session has expired. Please refresh the page and try again.",
    variant: "destructive",
  });
  return;
}
```

**Affected Functions:**
- `handleSavePrescription()` - Save new prescription
- `handleDeletePrescription()` - Delete prescription
- `handleSaveLabOrder()` - Save new lab order
- `handleDeleteLabOrder()` - Delete lab order

## How to Test

1. **Refresh the browser page** to get a fresh session and CSRF token
2. Navigate to a consultation's SOAP Notes page
3. Try the following operations:
   - Search for lab tests (should load categories and tests)
   - Add a prescription (should save successfully)
   - Add a lab order (should save successfully)
   - Delete a prescription or lab order (should work)

## Expected Behavior

### Before Fix:
- Console errors about JSON parsing
- "Unauthenticated" errors
- Operations fail silently or with cryptic errors

### After Fix:
- If session is valid: All operations work normally
- If session expired: Clear "Session Expired" message with instructions to refresh
- Better error messages for all failures

## Prevention

To prevent this issue in the future:

1. **Always include these headers in API calls:**
   ```typescript
   const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
   
   headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "X-CSRF-TOKEN": csrfToken,
     "X-Requested-With": "XMLHttpRequest",
   },
   credentials: "include",
   ```

2. **Always check content-type before parsing JSON:**
   ```typescript
   const contentType = response.headers.get("content-type");
   if (!contentType || !contentType.includes("application/json")) {
     // Handle authentication redirect
     return;
   }
   const result = await response.json();
   ```

3. **Provide helpful error messages:**
   - Tell users to refresh if session expired
   - Log errors to console for debugging
   - Show user-friendly messages in toasts

## Related Files

- `routes/api.php` - API routes with `auth:sanctum` middleware
- `app/Http/Controllers/API/TestCatalogController.php` - Test catalog API controller
- `app/Http/Controllers/API/OpdPrescriptionController.php` - Prescription API controller
- `app/Http/Controllers/API/OpdLabOrderController.php` - Lab order API controller

## Session Configuration

Ensure your `.env` has proper session settings:

```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

## Next Steps

If you still see authentication errors after refreshing:

1. Clear Laravel cache:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```

2. Check if CSRF token meta tag exists in your layout:
   ```html
   <meta name="csrf-token" content="{{ csrf_token() }}">
   ```

3. Log out and log back in to get a fresh session

4. Check browser console Network tab:
   - Look for 401 (Unauthenticated) or 419 (CSRF token mismatch) responses
   - Verify headers are being sent correctly
   - Check if cookies are being set/sent

## Status

✅ **FIXED** - All API calls now have proper authentication headers and error handling.
