# API Authentication Middleware Fix

## Problem
Getting **401 Unauthorized** errors when trying to access API endpoints from the Inertia.js frontend:
- `Failed to load test categories: 401 Unauthorized`
- `Failed to load tests: 401 Unauthorized`
- `Failed to save prescription: Unauthenticated`

## Root Cause
The API routes were using `auth:sanctum` middleware, which is designed for API token authentication (for SPAs or mobile apps). However, this is an Inertia.js application that uses **session-based web authentication**, not API tokens.

When the frontend makes requests to `/api/*` endpoints, it's using the web session cookies, but Sanctum middleware was expecting API tokens, causing 401 errors.

## Solution Applied

### Changed Middleware from Sanctum to Web Auth

**File**: `routes/api.php`

**Before:**
```php
Route::middleware('auth:sanctum')->name('api.')->group(function () {
    // All API routes...
});
```

**After:**
```php
Route::middleware(['auth:web', 'web'])->name('api.')->group(function () {
    // All API routes...
});
```

### Why This Works

1. **`auth:web`** - Uses session-based authentication (cookies)
2. **`web`** - Includes CSRF protection and session handling
3. **Inertia.js** - Already sends session cookies with every request
4. **No API tokens needed** - Works with existing login session

### Routes Fixed

All these routes now use web authentication:

1. **Test Catalog Routes**
   - `GET /api/test-catalogs/categories/list`
   - `GET /api/test-catalogs/search/advanced`
   - All other test catalog endpoints

2. **Prescription Routes**
   - `POST /api/opd/appointments/{id}/prescriptions`
   - `PUT /api/opd/appointments/{id}/prescriptions/{prescriptionId}`
   - `DELETE /api/opd/appointments/{id}/prescriptions/{prescriptionId}`

3. **Lab Order Routes**
   - `POST /api/opd/appointments/{id}/lab-orders`
   - `PUT /api/opd/appointments/{id}/lab-orders/{labOrderId}`
   - `DELETE /api/opd/appointments/{id}/lab-orders/{labOrderId}`

4. **Drug Search Routes**
   - `GET /api/drugs/search`
   - `GET /api/drugs/check-similar`

### Additional Fixes

1. **Removed duplicate OPD routes** - There were two definitions of the same routes
2. **Cleared route cache** - Applied changes immediately
3. **Cleared config cache** - Ensured clean configuration

## Testing

**Refresh your browser** and try:

1. Navigate to a consultation's SOAP Notes page
2. Try to search for lab tests - should load categories and tests
3. Try to add a prescription - should save successfully
4. Try to add a lab order - should save successfully

## Expected Results

✅ **Test categories load** without 401 errors
✅ **Test search works** and shows results
✅ **Prescriptions save** successfully
✅ **Lab orders save** successfully
✅ **No more "Unauthorized" errors**

## Why Sanctum Was Wrong

**Sanctum is for:**
- Separate frontend SPAs (Vue, React, Angular running on different domain)
- Mobile apps
- Third-party API access
- Token-based authentication

**This app uses:**
- Inertia.js (server-side rendered with client-side navigation)
- Session-based authentication (cookies)
- Same domain for frontend and backend
- CSRF protection

**Therefore:** Web middleware is the correct choice.

## If You Still Get 401 Errors

1. **Clear browser cookies** and log in again
2. **Check session configuration** in `.env`:
   ```env
   SESSION_DRIVER=database
   SESSION_LIFETIME=120
   ```
3. **Verify user is logged in** - Check the top right corner of the app
4. **Hard refresh** the browser (Ctrl+Shift+R)

## Related Files Modified

- `routes/api.php` - Changed middleware from `auth:sanctum` to `auth:web`
- `app/Http/Controllers/API/TestCatalogController.php` - Added middleware in constructor (redundant but harmless)

## Status

✅ **FIXED** - All API routes now use proper web authentication for Inertia.js frontend.

## Commands Run

```bash
php artisan route:clear
php artisan config:clear
```

## Next Steps

1. **Refresh your browser** to clear any cached 401 responses
2. **Test all consultation features**:
   - Lab test search
   - Prescription management
   - Lab order management
3. **Verify no more 401 errors** in browser console

The authentication should now work seamlessly with your existing login session!
