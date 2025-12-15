# Admin Dashboard Clarification

## Two Controllers Found

1. **`AdminController`** (app/Http/Controllers/AdminController.php)
   - This is the ACTIVE controller used by `/admin/dashboard` route
   - Already has branch filtering for financial data
   - Handles master data stats (departments, wards, beds, tests, drugs)

2. **`Admin\AdminDashboardController`** (app/Http/Controllers/Admin/AdminDashboardController.php)
   - This controller is NOT being used by any route
   - We modified this one, but it has no effect
   - Can be deleted or repurposed

## What Needs Branch Filtering

The `AdminController` already filters:
- ✅ Financial Summary (revenue, payments, discounts)
- ✅ Branch Performance
- ✅ Discount Summary
- ✅ Payment Analytics

What's NOT filtered by branch (shows global data):
- ❌ Master Data Stats (total departments, wards, beds, tests, drugs)
- ❌ Recent Activity feed
- ❌ System Stats (users, patients, appointments)

## To Fix

We need to update `AdminController::dashboard()` method to:
1. Add branch filtering to master data stats
2. Add branch filtering to system stats
3. Pass branch_id to all relevant methods

## Current Behavior

When you select a branch:
- Financial metrics WILL change (revenue, payments, etc.)
- Master data counts will NOT change (still shows all branches)
- System stats will NOT change (still shows all branches)
