# Fix: Restart Vite Dev Server

## Issue
The error `Page not found: ./Pages/Nurse/Dashboard.tsx` occurs because Vite's dev server needs to be restarted to detect the new Dashboard.tsx file.

## Quick Fix (Recommended)

Run these commands in your terminal:

```powershell
# Stop current dev server (Ctrl+C if running)

# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Restart dev server
npm run dev
```

Then in your browser:
- Press `Ctrl+Shift+R` to hard refresh
- Navigate to `/nurse/dashboard`

## Detailed Steps

### Step 1: Stop the current dev server
If you have a dev server running, stop it by pressing `Ctrl+C` in the terminal where it's running.

### Step 2: Clear Vite cache (recommended)
```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
```

### Step 3: Restart the dev server
```powershell
npm run dev
```

Wait for the message: `VITE v... ready in ...ms`

### Step 4: Clear browser cache
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh
- Or open DevTools (F12) and right-click the refresh button, select "Empty Cache and Hard Reload"

### Step 5: Navigate to the dashboard
Go to: `http://localhost:8000/nurse/dashboard` (or your app URL)

## What Changed
- Created new file: `resources/js/Pages/Nurse/Dashboard.tsx`
- Updated controller to render `Nurse/Dashboard` instead of `Nurse/DashboardEnhanced`
- Fixed import paths to use `@/Components/ui` (capital C) for consistency

## Verification
After restarting, navigate to `/nurse/dashboard` and you should see the new modern dashboard design.

## Alternative: Use DashboardEnhanced temporarily
If you need to continue working immediately, you can temporarily revert the controller change:

In `app/Http/Controllers/Nurse/DashboardController.php`, change:
```php
return Inertia::render('Nurse/Dashboard', [
```

Back to:
```php
return Inertia::render('Nurse/DashboardEnhanced', [
```

This will use the old dashboard while you restart the dev server.
