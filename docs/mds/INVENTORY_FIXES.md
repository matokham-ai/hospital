# Pharmacy Inventory Fixes

## Issues Fixed

### 1. Store ID Constraint Violation
**Problem**: Database requires `store_id` to be non-null, but form allowed it to be optional.

**Solution**: 
- Added logic to automatically assign the first active store as default when no store is selected
- Added validation to ensure at least one active store exists
- Updated UI to clarify that default store will be used if none selected

### 2. Duplicate Drug Prevention
**Problem**: System could allow adding the same drug with same batch to the same store multiple times.

**Solution**:
- Added validation to check for existing drug+store+batch combinations
- Returns helpful error message suggesting to edit existing stock instead

### 3. Expiry Date Validation
**Problem**: Required expiry dates to be after today, which was too restrictive.

**Solution**:
- Changed validation to allow any valid date (including past dates for expired stock)
- This allows adding already expired items for proper inventory tracking

## Code Changes

### Backend (InventoryController.php)
```php
// Auto-assign default store if none selected
if (empty($validated['store_id'])) {
    $defaultStore = \App\Models\PharmacyStore::where('is_active', true)->first();
    if (!$defaultStore) {
        return redirect()->back()->withErrors(['store_id' => 'No active pharmacy store found.']);
    }
    $validated['store_id'] = $defaultStore->id;
}

// Check for duplicate drug+store+batch combinations
$existingStock = PharmacyStock::where('drug_id', $validated['drug_id'])
    ->where('store_id', $validated['store_id'])
    ->where('batch_no', $validated['batch_no'] ?? null)
    ->first();

if ($existingStock) {
    return redirect()->back()->withErrors(['drug_id' => 'This drug already exists in the store.']);
}
```

### Frontend (Inventory.tsx)
- Updated store dropdown text to "Use default store"
- Added helpful text explaining default store behavior
- Improved user experience with clearer messaging

## Database Schema Understanding
- `store_id` is required (NOT NULL) in pharmacy_stock table
- Foreign key constraint to pharmacy_stores table
- System expects at least one active pharmacy store to exist

## User Experience Improvements
1. **Automatic Store Assignment**: Users don't need to select a store if there's only one
2. **Clear Messaging**: UI explains what happens when no store is selected
3. **Duplicate Prevention**: Prevents accidental duplicate entries
4. **Flexible Date Handling**: Allows adding expired stock for inventory accuracy

## Testing Recommendations
1. Test adding stock without selecting a store (should use default)
2. Test adding duplicate drug+batch combinations (should show error)
3. Test with expired dates (should work)
4. Test when no active stores exist (should show error)