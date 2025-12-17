# Prescription Error - Quick Fix Guide

## The Error You're Seeing
```
Failed to save prescription
Unauthenticated
```

## Quick Fix (Try This First)

### Step 1: Refresh the Page
Press **F5** or **Ctrl+R** (Cmd+R on Mac)

This fixes 90% of cases because it:
- Gets a fresh authentication session
- Gets a new CSRF token
- Reloads the page with proper auth

### Step 2: Try Again
After refreshing:
1. Search for a drug
2. Select it from the list
3. Fill in the prescription form
4. Click "Save Prescription"

**If it works now**: ✅ You're done!

**If it still fails**: Continue to Step 3

---

## Step 3: Check User Permissions

Your user needs the **'prescribe drugs'** permission.

### Grant Permission via Tinker

```bash
php artisan tinker
```

Then run:
```php
$user = User::where('email', 'YOUR_EMAIL@example.com')->first();
$user->givePermissionTo('prescribe drugs');
exit
```

Replace `YOUR_EMAIL@example.com` with your actual email.

### OR Assign Doctor Role

```bash
php artisan tinker
```

Then run:
```php
$user = User::where('email', 'YOUR_EMAIL@example.com')->first();
$user->assignRole('Doctor');
exit
```

---

## Step 4: Clear Cache (If Still Not Working)

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

Then refresh the browser page again.

---

## Step 5: Log Out and Log Back In

Sometimes the session is corrupted. Try:
1. Click your profile → Logout
2. Log back in
3. Navigate back to the consultation
4. Try adding a prescription again

---

## What Was Fixed

I've updated the code to:
1. ✅ Add proper authentication headers to all API calls
2. ✅ Check if response is JSON before parsing (prevents cryptic errors)
3. ✅ Show "Session Expired" message instead of confusing errors
4. ✅ Include CSRF token in all requests

**Files Updated:**
- `resources/js/Components/Consultation/PrescriptionForm.tsx`
- `resources/js/Pages/OPD/SoapNotes.tsx`

---

## Still Not Working?

Check the browser console (F12 → Console tab) and share:
1. Any error messages you see
2. The Network tab response for the failed request
3. Your user's email address so we can check permissions

---

## Why This Happens

**Session Expiration**: Laravel sessions expire after 2 hours by default. When you try to save a prescription after the session expires, the API returns "Unauthenticated".

**Missing Permission**: The prescription API requires the 'prescribe drugs' permission. If your user doesn't have this permission, you'll get "Unauthorized" errors.

---

## Prevention

To avoid this in the future:

1. **Increase session lifetime** - Edit `.env`:
   ```env
   SESSION_LIFETIME=480  # 8 hours
   ```

2. **Use "Remember Me"** when logging in

3. **Refresh the page** if you've been idle for a while before trying to save

---

## Summary

**Most Common Fix**: Just refresh the page (F5)

**If that doesn't work**: Grant 'prescribe drugs' permission to your user

**If still stuck**: Share the error details and we'll help debug further
