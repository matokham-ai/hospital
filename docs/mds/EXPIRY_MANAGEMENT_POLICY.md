# Pharmacy Expiry Management Policy

## Philosophy: Allow Editing with Smart Warnings

The system allows editing of expiring/expired medicines but implements progressive warnings and restrictions to ensure safe pharmacy practices.

## Expiry Status Categories

### 1. **Good** (>90 days until expiry)
- ✅ Full editing allowed
- ✅ No restrictions
- ✅ Standard operations

### 2. **Expiring Warning** (30-90 days until expiry)
- ✅ Editing allowed
- ⚠️ Visual indicators (orange)
- ⚠️ Caution message on edit
- ⚠️ Large quantity increase validation

### 3. **Expiring Soon** (<30 days until expiry)
- ✅ Editing allowed with confirmation
- ⚠️ Strong visual warnings (orange)
- ⚠️ Confirmation dialog required
- ⚠️ Quantity increase restrictions

### 4. **Expired** (past expiry date)
- ⚠️ Editing allowed with strong warnings
- 🚫 Cannot increase quantities
- ⚠️ Disposal recommendations
- ⚠️ Audit trail markers

## Frontend Safeguards

### Visual Indicators
```typescript
// Edit button colors based on expiry status
expired: 'text-red-600' + '⚠️ Edit'
expiring-soon: 'text-orange-600' + '⏰ Edit'  
good: 'text-blue-600' + 'Edit'
```

### Confirmation Dialogs
- **Expired**: "⚠️ WARNING: This medicine expired on [date]. Expired medicines should typically be disposed of safely. Are you sure you want to edit?"
- **Expiring Soon**: "⚠️ CAUTION: This medicine expires in [X] days. Consider prioritizing its use or disposal. Continue editing?"

### Modal Warnings
- **Red banner** for expired medicines with disposal reminder
- **Orange banner** for expiring medicines with usage priority reminder

## Backend Validations

### Quantity Restrictions
```php
// Expired medicines - no quantity increases
if (expired && quantity > oldQuantity) {
    return error('Cannot increase quantity of expired medicine');
}

// Expiring soon - limit large increases
if (expiring_soon && quantity > oldQuantity * 1.5) {
    return error('Large quantity increase detected for expiring medicine');
}
```

### Audit Trail Enhancement
- Movement records include expiry status: `[EXPIRED STOCK]` or `[EXPIRING SOON]`
- Clear tracking of operations on time-sensitive inventory

## Deletion Safeguards

### Smart Confirmation Messages
- **Expired Stock**: Reminds about safe disposal protocols
- **Active Stock**: Warns about removing inventory with quantities
- **Standard**: Normal deletion confirmation

## Business Logic Rationale

### Why Allow Expired Medicine Editing?
1. **Audit Compliance**: Need to track expired stock for regulatory reporting
2. **Disposal Tracking**: Must record disposal activities properly
3. **Correction Needs**: Sometimes expiry dates need correction
4. **Quantity Adjustments**: May need to reduce quantities during disposal

### Why Restrict Quantity Increases?
1. **Patient Safety**: Prevent accidental dispensing of expired medicines
2. **Regulatory Compliance**: Avoid increasing expired stock levels
3. **Best Practices**: Encourage proper inventory rotation

### Why Progressive Warnings?
1. **User Education**: Helps staff understand expiry implications
2. **Workflow Guidance**: Encourages proper prioritization
3. **Error Prevention**: Reduces accidental operations on critical stock

## Recommended Workflows

### For Expired Medicines
1. **Identify**: System highlights expired stock
2. **Segregate**: Physically separate expired stock
3. **Document**: Use edit function to adjust quantities during disposal
4. **Dispose**: Follow pharmacy disposal protocols
5. **Record**: Delete from system after safe disposal

### For Expiring Medicines
1. **Prioritize**: Use expiring stock first (FEFO - First Expired, First Out)
2. **Monitor**: Regular review of expiring stock reports
3. **Adjust**: Reduce min/max levels if consistently expiring
4. **Transfer**: Move to high-usage areas if appropriate

## System Benefits
- **Safety First**: Prevents dangerous quantity increases
- **Flexibility**: Allows necessary corrections and adjustments  
- **Compliance**: Maintains proper audit trails
- **Education**: Guides users toward best practices
- **Efficiency**: Reduces accidental operations while maintaining functionality

This approach balances operational flexibility with patient safety and regulatory compliance.