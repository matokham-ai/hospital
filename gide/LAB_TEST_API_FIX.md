# Lab Test API Authentication Fix

## Problem
The lab test search is failing with:
- `Failed to load test categories: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- `Failed to load tests: SyntaxError: Unexpected token '<'`
- `Unauthenticated` error

This happens because the API endpoints are returning HTML (login page) instead of JSON when authentication fails.

## Root Cause
The API routes in `routes/api.php` are protected by `auth:sanctum` middleware, but the session has expired or CSRF token is invalid.

## Solution Applied

### 1. Updated LabTestSearch Component
Added proper authentication headers to all API calls:
- `X-CSRF-TOKEN` header with CSRF token from meta tag
- `X-Requested-With: XMLHttpRequest` header
- `credentials: "include"` for cookie-based auth
- Proper error handling

### 2. Updated SoapNotes Component
Added content-type checking before parsing JSON responses:
- Check if response is JSON before calling `.json()`
- Show "Session Expired" message if HTML is returned
- Better error messages for all API operations

### 3. Files Modified
- `resources/js/Components/Consultation/LabTestSearch.tsx`
- `resources/js/Pages/OPD/SoapNotes.tsx`

## How to Fix

### Option 1: Refresh the Page
The simplest solution is to refresh the browser page to get a new session and CSRF token.

### Option 2: Check Session Configuration
Ensure your `.env` file has proper session configuration:

```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

### Option 3: Clear Cache and Restart
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

Then restart your development server.

### Option 4: Check CSRF Token Meta Tag
Ensure your layout file has the CSRF token meta tag:

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

This should be in `resources/views/app.blade.php` or your main layout file.

## Testing

1. Refresh the browser page
2. Open the SOAP Notes page for a consultation
3. Try to search for lab tests
4. Check the browser console - you should no longer see the JSON parsing errors

## API Endpoints Being Used

1. **Get Categories**: `GET /api/test-catalogs/categories/list`
   - Returns array of category names
   - Requires authentication

2. **Search Tests**: `GET /api/test-catalogs/search/advanced?query=...&category=...&status=active`
   - Returns array of test catalog objects
   - Requires authentication

## If Still Not Working

Check the browser Network tab:
1. Look for the API requests to `/api/test-catalogs/...`
2. Check the Response tab - if you see HTML instead of JSON, authentication is still failing
3. Check the Headers tab - ensure `X-CSRF-TOKEN` is being sent
4. Check the Status code - should be 200, not 401 or 419

If you see 419 (CSRF token mismatch), the CSRF token is invalid. Refresh the page.
If you see 401 (Unauthenticated), the session has expired. Log out and log back in.
