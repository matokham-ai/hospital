# 🔧 Troubleshooting 404 Error for Drug Wizard

## Issue
Accessing `/pharmacy/drugs/create` returns 404 error.

## ✅ Verified Working
- ✅ Route is registered: `pharmacy.drugs.create`
- ✅ Controller method exists: `PharmacyController@createDrug`
- ✅ Inertia page exists: `resources/js/Pages/Pharmacist/DrugWizard.tsx`
- ✅ No TypeScript errors
- ✅ DrugFormulary model works
- ✅ Route cache cleared

## 🔍 Possible Causes & Solutions

### 1. Browser Cache
**Solution:**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache completely

### 2. Vite Dev Server Not Running
**Solution:**
```bash
# Stop any running Vite process
# Then restart:
npm run dev
```

### 3. Route Cache Issue
**Solution:**
```bash
php artisan route:clear
php artisan config:clear
php artisan view:clear
php artisan cache:clear
```

### 4. Middleware/Auth Issue
**Check if you're logged in as Pharmacist:**
- Log out and log back in
- Verify your user role is "Pharmacist"

### 5. Web Server Not Restarted
**If using Laravel Sail/Docker:**
```bash
sail restart
```

**If using php artisan serve:**
```bash
# Stop the server (Ctrl+C)
php artisan serve
```

**If using Apache/Nginx:**
- Restart the web server

### 6. Asset Compilation
**Solution:**
```bash
# Build assets
npm run build

# Or for development
npm run dev
```

## 🧪 Test the Route

### Method 1: Check Route List
```bash
php artisan route:list --name=pharmacy.drugs
```

Expected output:
```
POST   pharmacy/drugs ........ pharmacy.drugs.store
GET    pharmacy/drugs/create . pharmacy.drugs.create
```

### Method 2: Direct URL Test
Navigate to: `http://your-domain/pharmacy/drugs/create`

### Method 3: Check Laravel Logs
```bash
tail -f storage/logs/laravel.log
```

Then try accessing the page and watch for errors.

## 🎯 Quick Fix Checklist

Run these commands in order:

```bash
# 1. Clear all caches
php artisan route:clear
php artisan config:clear
php artisan view:clear
php artisan cache:clear

# 2. Verify route exists
php artisan route:list --name=pharmacy.drugs.create

# 3. Restart Vite
npm run dev

# 4. Hard refresh browser
# Press Ctrl + Shift + R
```

## 📝 If Still Not Working

1. Check Laravel logs: `storage/logs/laravel.log`
2. Check browser console for JavaScript errors
3. Verify you're logged in as a Pharmacist user
4. Check if other pharmacy routes work (e.g., `/pharmacy/dashboard`)

## ✅ Expected Behavior

When working correctly:
1. Navigate to `/pharmacy/drugs/create`
2. Should see a 4-step wizard with:
   - Step 1: Basic Drug Identification
   - Step 2: Classification & Strength
   - Step 3: Stock & Pricing
   - Step 4: Safety & Clinical Notes

## 🆘 Still Having Issues?

The route and controller are confirmed working. The issue is likely:
- **Browser cache** (most common)
- **Vite dev server** not running
- **Authentication** issue

Try accessing from an incognito/private browser window to rule out cache issues.
