# Billing System: How billing_accounts and billing_items Work Together

## Overview
Your billing system uses a **header-detail** relationship pattern where:
- `billing_accounts` = **Header/Master record** (like an invoice header)
- `billing_items` = **Detail/Line items** (like individual charges on an invoice)

## Table Relationship

### billing_accounts (Master/Header)
```sql
- id (primary key)
- account_no (unique identifier like "BA000001")
- patient_id (which patient)
- encounter_id (which hospital visit/admission)
- status (open/closed)
- total_amount (sum of all items)
- amount_paid (payments received)
- balance (total_amount - amount_paid)
- created_at, updated_at
```

### billing_items (Details/Line Items)
```sql
- id (primary key)
- encounter_id (links to billing_accounts via encounter_id)
- item_type (consultation, lab_test, pharmacy, etc.)
- description (what was charged for)
- quantity (how many)
- unit_price (price per unit)
- amount (quantity × unit_price)
- discount_amount (any discounts)
- net_amount (amount - discount_amount)
- service_code (internal reference)
- status (unpaid/paid/cancelled)
- posted_at (when charge was added)
```

## How They Connect

**Key Connection**: Both tables share the same `encounter_id`
- One `billing_account` per encounter
- Multiple `billing_items` per encounter
- Relationship: `billing_accounts.encounter_id = billing_items.encounter_id`

## Real-World Example

### Scenario: Patient John Doe is admitted for 2 days

#### 1. billing_accounts (One Record)
```
account_no: BA000123
patient_id: P001
encounter_id: 123
status: open
total_amount: 25,750.00 (calculated from items below)
amount_paid: 10,000.00
balance: 15,750.00
```

#### 2. billing_items (Multiple Records for same encounter_id: 123)
```
Item 1: Consultation
- description: "General Consultation - Dr. Smith"
- quantity: 1
- unit_price: 5,000.00
- net_amount: 5,000.00

Item 2: Lab Test
- description: "Complete Blood Count (CBC)"
- quantity: 1
- unit_price: 2,500.00
- discount_amount: 250.00
- net_amount: 2,250.00

Item 3: Bed Charge
- description: "General Ward Bed - 2 days"
- quantity: 2
- unit_price: 3,000.00
- net_amount: 6,000.00

Item 4: Pharmacy
- description: "Paracetamol 500mg"
- quantity: 20
- unit_price: 250.00
- net_amount: 5,000.00

Item 5: X-Ray
- description: "Chest X-Ray"
- quantity: 1
- unit_price: 3,500.00
- net_amount: 3,500.00

Item 6: IV Fluids
- description: "Normal Saline 500ml"
- quantity: 4
- unit_price: 1,000.00
- net_amount: 4,000.00

TOTAL: 25,750.00 KES
```

## Workflow Process

### 1. Patient Admission/Visit
```php
// Create billing account
$billingAccount = BillingAccount::create([
    'account_no' => 'BA000123',
    'patient_id' => 'P001',
    'encounter_id' => 123,
    'status' => 'open',
    'total_amount' => 0,
    'amount_paid' => 0,
    'balance' => 0,
]);
```

### 2. Services Provided (Automatic Billing)
```php
// When consultation happens
BillingItem::create([
    'encounter_id' => 123,
    'item_type' => 'consultation',
    'description' => 'General Consultation',
    'quantity' => 1,
    'unit_price' => 5000.00,
    'net_amount' => 5000.00,
    'status' => 'unpaid',
]);

// When lab test ordered
BillingItem::create([
    'encounter_id' => 123,
    'item_type' => 'lab_test',
    'description' => 'Complete Blood Count',
    'quantity' => 1,
    'unit_price' => 2500.00,
    'net_amount' => 2500.00,
    'status' => 'unpaid',
]);
```

### 3. Update Account Totals
```php
// Recalculate billing account totals
$totalAmount = BillingItem::where('encounter_id', 123)
    ->where('status', '!=', 'cancelled')
    ->sum('net_amount');

$billingAccount->update([
    'total_amount' => $totalAmount,
    'balance' => $totalAmount - $billingAccount->amount_paid,
]);
```

### 4. Payment Processing
```php
// When patient pays 10,000 KES
$billingAccount->amount_paid += 10000;
$billingAccount->balance = $billingAccount->total_amount - $billingAccount->amount_paid;
$billingAccount->save();
```

## Key Benefits of This Structure

### 1. **Flexibility**
- Add charges anytime during the encounter
- Modify individual items without affecting others
- Apply discounts to specific items

### 2. **Detailed Tracking**
- See exactly what patient was charged for
- Track when each charge was added
- Monitor payment status per item

### 3. **Reporting**
- Generate detailed invoices
- Analyze revenue by service type
- Track most profitable services

### 4. **Audit Trail**
- Who added each charge
- When charges were posted
- Payment history

## Model Relationships in Laravel

```php
// BillingAccount Model
class BillingAccount extends Model
{
    public function items()
    {
        return $this->hasMany(BillingItem::class, 'encounter_id', 'encounter_id');
    }
    
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }
    
    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }
}

// BillingItem Model
class BillingItem extends Model
{
    public function billingAccount()
    {
        return $this->belongsTo(BillingAccount::class, 'encounter_id', 'encounter_id');
    }
    
    public function encounter()
    {
        return $this->belongsTo(Encounter::class);
    }
}
```

## Common Queries

### Get all charges for a patient's visit:
```php
$billingAccount = BillingAccount::with('items')
    ->where('encounter_id', 123)
    ->first();

foreach ($billingAccount->items as $item) {
    echo $item->description . ': KES ' . number_format($item->net_amount, 2);
}
```

### Calculate total unpaid amount:
```php
$unpaidTotal = BillingItem::where('encounter_id', 123)
    ->where('status', 'unpaid')
    ->sum('net_amount');
```

### Get revenue by service type:
```php
$revenueByType = BillingItem::select('item_type', DB::raw('SUM(net_amount) as total'))
    ->where('status', 'paid')
    ->groupBy('item_type')
    ->get();
```

## Summary

Think of it like a restaurant bill:
- **billing_accounts** = The bill header (table number, date, total)
- **billing_items** = Individual items ordered (burger, fries, drink)

The system automatically:
1. Creates a billing account when patient is admitted
2. Adds charges as services are provided
3. Updates totals in real-time
4. Tracks payments and balances
5. Provides detailed reporting

This structure gives you complete visibility into what patients owe and why, making billing transparent and manageable.