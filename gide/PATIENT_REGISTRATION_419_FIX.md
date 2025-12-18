# Patient Registration 419 Error - Fix Applied

## Problem
When creating a patient, a 419 error (CSRF token mismatch) occurs and the details don't save to the database.

## Root Cause
The issue is related to CSRF token handling in Inertia.js applications. The CSRF token needs to be explicitly passed in the request headers when submitting forms via Inertia.js.

## Fixes Applied

### 1. Updated `resources/js/Pages/Patients/Create.tsx`
Modified the `submitForm` function to explicitly include the CSRF token in request headers:
- Reads CSRF token from meta tag
- Passes it as `X-CSRF-TOKEN` header in the POST request
- Added console logging for debugging

### 2. Cleared Application Caches
Ran the following commands:
- `php artisan config:clear` - Cleared configuration cache
- `php artisan cache:clear` - Cleared application cache
- `php artisan view:clear` - Cleared compiled views

### 3. Verified Session Configuration
Confirmed that:
- Session driver is set to 'database'
- Sessions table exists in the database
- Session domain is properly configured
- SANCTUM_STATEFUL_DOMAINS includes the application URL

## Additional Steps Required

### Step 1: Clear Configuration Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Step 2: Verify Sessions Table
```bash
php artisan migrate:status
```

If the sessions table doesn't exist:
```bash
php artisan session:table
php artisan migrate
```

### Step 3: Update .env (if needed)
Ensure these settings match your environment:
```env
SESSION_DRIVER=database
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=false
SESSION_HTTP_ONLY=true
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:8000,localhost:8000,192.168.100.8:8000
```

### Step 4: Restart Development Server
After making changes, restart your development server:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
php artisan serve --host=192.168.100.8 --port=8000
```

And restart Vite:
```bash
npm run dev
```

## Testing the Fix

### Step 1: Restart Development Servers
```bash
# Stop current servers (Ctrl+C in each terminal)

# Terminal 1: Start Laravel development server
php artisan serve --host=192.168.100.8 --port=8000

# Terminal 2: Start Vite development server
npm run dev
```

### Step 2: Clear Browser Cache
1. Open your browser
2. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
3. Clear cookies and cached files
4. Close and reopen the browser

### Step 3: Test Patient Registration
1. Navigate to `http://192.168.100.8:8000/patients/create`
2. Fill in the patient registration form with test data
3. Submit the form
4. Verify that:
   - No 419 error occurs
   - Patient is successfully created
   - You're redirected to the patients list
   - Success message is displayed

## Debugging if Issue Persists

### Check Browser Console
Open browser DevTools (F12) and check:
1. **Console Tab**: Look for any JavaScript errors or CSRF token logs
2. **Network Tab**: 
   - Find the POST request to `/patients`
   - Check Request Headers for `X-CSRF-TOKEN`
   - Check Response status (should be 302 redirect on success)
3. **Application Tab**: 
   - Check Cookies - look for Laravel session cookie
   - Verify the cookie domain matches your URL

### Verify CSRF Token in Browser
Open browser console and run:
```javascript
console.log('CSRF Token:', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'));
```
This should output a 40-character token.

### Check Laravel Logs
```bash
# Windows
type storage\logs\laravel.log | findstr /i "419 csrf token"

# Or view the entire log
notepad storage\logs\laravel.log
```

### Common Issues and Solutions

#### Issue 1: Session Cookie Not Being Set
**Symptom**: No Laravel session cookie in browser
**Solution**: 
1. Check `.env` file:
   ```env
   SESSION_DOMAIN=
   SESSION_SECURE_COOKIE=false
   ```
2. Clear config cache: `php artisan config:clear`
3. Restart server

#### Issue 2: CSRF Token Not in Meta Tag
**Symptom**: Meta tag is empty or missing
**Solution**: 
1. Check `resources/views/app.blade.php` has:
   ```html
   <meta name="csrf-token" content="{{ csrf_token() }}">
   ```
2. Clear view cache: `php artisan view:clear`

#### Issue 3: Middleware Not Applied
**Symptom**: Route works without authentication
**Solution**: 
1. Verify route has `web` middleware in `routes/patients.php`
2. Check `bootstrap/app.php` has HandleInertiaRequests middleware

#### Issue 4: Browser Caching Old JavaScript
**Symptom**: Changes not reflected in browser
**Solution**:
1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R`)
2. Clear browser cache completely
3. Check Vite is running and compiling changes

## Files Modified
- `resources/js/Pages/Patients/Create.tsx` - Added explicit CSRF token header
- Cleared application caches (config, cache, view)

## Verification Checklist
- [x] Sessions table exists in database
- [x] Session driver is set to 'database'
- [x] CSRF token meta tag is present in app.blade.php
- [x] HandleInertiaRequests middleware is registered
- [x] Patients store route has 'web' middleware
- [x] CSRF token is explicitly passed in form submission
- [x] Application caches cleared

## Next Steps
1. Follow the testing steps above
2. If successful, the patient should be created without errors
3. If issue persists, follow the debugging steps
4. Check Laravel logs for specific error messages
