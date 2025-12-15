# 🧾 Hospital Billing & Charges System Implementation

## Overview
This implementation provides a comprehensive billing system for the Hospital Management System with real-time running bills, automatic charge integration, and flexible payment processing.

## 🏗️ Core Architecture

### Database Schema

#### 1. **service_catalogues** - Master pricing catalog
```sql
- id, code, name, category, description
- unit_price, unit_of_measure, department_id
- is_active, is_billable, tax_rate
- timestamps
```

#### 2. **billing_accounts** - Patient billing accounts per encounter
```sql
- id, account_no, patient_id, encounter_id
- status (open|closed|discharged|cancelled)
- total_amount, discount_amount, net_amount
- amount_paid, balance, created_by, closed_at
- timestamps
```

#### 3. **billing_items** - Individual charges/services
```sql
- id, billing_account_id, encounter_id, item_type
- item_id (service_catalogue), service_code, description
- quantity, unit_price, amount, discount_amount, net_amount
- status (pending|posted|cancelled), created_by
- reference_id, reference_type (polymorphic), posted_at
- timestamps
```

#### 4. **payments** - Payment transactions
```sql
- id, billing_account_id, invoice_id, amount
- method (cash|card|bank_transfer|mobile_money|insurance)
- reference_no, received_by, notes
- timestamps
```

## 🔧 Key Components

### 1. Models

#### ServiceCatalogue
- Master catalog of all billable services
- Categories: consultation, lab_test, imaging, procedure, medication, consumable, bed_charge, nursing
- Pricing and department associations

#### BillingAccount
- One per encounter (inpatient/outpatient)
- Tracks total charges, payments, and balance
- Auto-recalculates totals when items change

#### BillingItem
- Individual charges linked to services
- Polymorphic relationship to source (LabOrder, Prescription, etc.)
- Automatic posting and amount calculations

### 2. BillingService
Core service class handling all billing operations:

```php
// Create/get billing account
$billingAccount = $billingService->getOrCreateBillingAccount($encounter);

// Add charges
$billingService->addConsultationCharge($encounter);
$billingService->addLabTestCharge($encounter, $labOrder);
$billingService->addBedCharge($encounter, $bedAssignment, $days);

// Add consumables
$billingService->addMultipleConsumables($encounter, [
    ['name' => 'IV Cannula', 'quantity' => 2, 'unit_price' => 300],
    ['name' => 'Syringe 5ml', 'quantity' => 5, 'unit_price' => 50],
]);

// Get running bill
$runningBill = $billingService->getRunningBill($encounter);

// Process payments
$billingAccount->addPayment(1000, 'cash', 'REF123');
```

### 3. Event-Driven Billing
Automatic charge creation through Laravel events:

```php
// When lab order is created → automatically adds lab test charge
LabOrderCreated::dispatch($labOrder);

// When consultation is completed → adds consultation charge
ConsultationCompleted::dispatch($encounter);
```

### 4. Controllers

#### BillingController
- Web interface for viewing/managing bills
- Add items, apply discounts, process payments
- Close billing accounts at discharge

#### ServiceCatalogueController
- Manage service pricing catalog
- CRUD operations for services

## 🚀 Usage Examples

### 1. **Real-time Running Bill**
```php
// Get current bill status for any encounter
$encounter = Encounter::find(1);
$runningBill = app(BillingService::class)->getRunningBill($encounter);

// Returns:
[
    'account' => BillingAccount,
    'items' => [
        'consultation' => [...],
        'lab_test' => [...],
        'consumable' => [...],
    ],
    'summary' => [
        'total_amount' => 5000,
        'discount_amount' => 500,
        'net_amount' => 4500,
        'amount_paid' => 2000,
        'balance' => 2500,
    ]
]
```

### 2. **Quick Consumables Entry**
```php
// Add multiple items at once
$items = [
    ['name' => 'IV Cannula 18G', 'quantity' => 2, 'unit_price' => 300],
    ['name' => 'Syringe 5ml', 'quantity' => 5, 'unit_price' => 50],
    ['name' => 'Surgical Gloves', 'quantity' => 3, 'unit_price' => 100],
];

$billingService->addMultipleConsumables($encounter, $items);
```

### 3. **Automatic Lab Test Billing**
```php
// Creating a lab order automatically adds billing
$labOrder = LabOrder::create([
    'encounter_id' => $encounter->id,
    'patient_id' => $encounter->patient_id,
    'test_name' => 'Full Blood Count',
    'status' => 'pending'
]);
// → Automatically creates billing item via event listener
```

### 4. **Payment Processing**
```php
$billingAccount = BillingAccount::find(1);

// Process payment
$payment = $billingAccount->addPayment(
    amount: 1500,
    method: 'card',
    reference: 'TXN123456'
);

// Account balance automatically updated
```

## 🌐 Web Interface

### Running Bill Page
- **URL**: `/inpatient/billing/encounters/{encounter}`
- Real-time bill display grouped by service type
- Quick add consumables/services
- Payment processing interface
- Discount application

### Service Catalogue Management
- **URL**: `/inpatient/service-catalogue`
- Manage pricing for all services
- Category-based organization
- Department associations

## 🔗 Integration Points

### 1. **Lab System Integration**
```php
// In LabOrder model
protected static function booted()
{
    static::created(function ($labOrder) {
        LabOrderCreated::dispatch($labOrder);
    });
}
```

### 2. **Pharmacy Integration**
```php
// When medication is dispensed
$billingService->addBillingItem(
    $encounter,
    BillingItem::TYPE_MEDICATION,
    "Medication: {$medication->name}",
    $quantity,
    $unitPrice,
    reference: $dispensation
);
```

### 3. **Bed Management Integration**
```php
// Daily bed charges
$billingService->addBedCharge($encounter, $bedAssignment, $days = 1);
```

## 🧪 Testing the System

### API Test Endpoints
```bash
# Test complete billing workflow
POST /api/billing/test

# Get service catalogue
GET /api/billing/services

# Test payment processing
POST /api/billing/test-payment
```

### Sample Test Response
```json
{
    "success": true,
    "message": "Billing test completed successfully",
    "data": {
        "encounter": {
            "id": 1,
            "encounter_number": "ENC20251014001",
            "patient_name": "John Doe",
            "department": "General Medicine"
        },
        "billing_account": {
            "id": 1,
            "account_no": "BA202510140001",
            "status": "open"
        },
        "charges_added": {
            "consultation": {...},
            "consumables": [...],
            "lab_order": {...}
        },
        "running_bill": {
            "summary": {
                "total_amount": 3650,
                "net_amount": 3650,
                "balance": 3650
            }
        }
    }
}
```

## 📊 Key Features Implemented

✅ **Real-time Running Bills** - Live updates as services are added  
✅ **Automatic Charge Integration** - Lab tests, consultations auto-billed  
✅ **Quick Consumables Entry** - Bulk add common items  
✅ **Flexible Payment Processing** - Multiple payment methods  
✅ **Service Catalogue Management** - Centralized pricing  
✅ **Discount Management** - Item-level discounts  
✅ **Event-Driven Architecture** - Automatic billing triggers  
✅ **Polymorphic References** - Link charges to source services  
✅ **Account Status Management** - Open/closed billing cycles  

## 🔄 Workflow Summary

1. **Patient Encounter Created** → Billing account auto-created
2. **Services Provided** → Charges automatically added via events
3. **Manual Items Added** → Quick entry for consumables/procedures
4. **Payments Processed** → Real-time balance updates
5. **Discharge** → Billing account closed, final invoice generated

## 🎯 Next Steps

1. **Invoice Generation** - PDF invoices from billing accounts
2. **Insurance Integration** - Claims processing workflow
3. **Reporting Dashboard** - Revenue analytics and reports
4. **Mobile Interface** - Bedside billing entry
5. **Audit Trail** - Complete billing change history

This implementation provides a solid foundation for hospital billing with room for future enhancements based on specific operational needs.