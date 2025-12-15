# Stock Movement Type Fix

## Issue
The `movement_type` column in the `stock_movements` table is an ENUM with restricted values, but the code was trying to use custom values like `MANUAL_ADD`, `MANUAL_INCREASE`, etc.

## Database Schema
The `movement_type` ENUM only allows these values:
- `GRN` - Goods Received Note (stock coming in)
- `TRANSFER` - Stock transfer between stores
- `ADJUSTMENT` - Manual adjustments (increase/decrease)
- `RETURN` - Stock returns

## Solution
Updated all manual operations to use the `ADJUSTMENT` movement type with descriptive remarks:

### Before (Incorrect)
```php
'movement_type' => 'MANUAL_ADD'           // ❌ Not in ENUM
'movement_type' => 'MANUAL_INCREASE'      // ❌ Not in ENUM  
'movement_type' => 'MANUAL_DECREASE'      // ❌ Not in ENUM
'movement_type' => 'MANUAL_DELETE'        // ❌ Not in ENUM
```

### After (Correct)
```php
'movement_type' => 'ADJUSTMENT'           // ✅ Valid ENUM value
'remarks' => 'Manual stock addition'      // ✅ Descriptive context
'remarks' => 'Manual stock increase from 50 to 100'  // ✅ Clear details
'remarks' => 'Stock item deleted - removing 25 units' // ✅ Audit trail
```

## Changes Made

### 1. Stock Addition
- **Movement Type**: `ADJUSTMENT`
- **Reference**: `ADD-{stock_id}`
- **Remarks**: "Manual stock addition"

### 2. Stock Updates
- **Movement Type**: `ADJUSTMENT`
- **Reference**: `UPDATE-{stock_id}`
- **Remarks**: Detailed before/after quantities

### 3. Stock Deletion
- **Movement Type**: `ADJUSTMENT`
- **Reference**: `DELETE-{stock_id}`
- **Remarks**: Quantity being removed

## Benefits
1. **Compliance**: Uses valid ENUM values
2. **Audit Trail**: Clear remarks explain what happened
3. **Traceability**: Reference numbers link to specific operations
4. **Consistency**: All manual operations use ADJUSTMENT type

## Database Movement Types Usage
- **GRN**: Used by existing GRN functionality for receiving stock
- **TRANSFER**: Available for future store-to-store transfers
- **ADJUSTMENT**: Used for all manual CRUD operations
- **RETURN**: Available for future return functionality

The system now properly tracks all inventory changes while respecting the database constraints.