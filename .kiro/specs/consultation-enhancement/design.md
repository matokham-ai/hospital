# Design Document

## Overview

This design document outlines the enhancement of the consultation workflow to provide doctors with comprehensive patient information, including emergency status, streamlined medication prescription with instant dispensing capabilities, and laboratory test ordering with priority levels. The solution integrates with existing Laravel/Inertia.js architecture and builds upon the current OPD consultation system.

The enhancement focuses on improving clinical decision-making by surfacing critical patient information at the point of care, reducing navigation overhead, and enabling efficient prescription and lab order workflows that respect the urgency of emergency cases.

## Architecture

### System Components

The consultation enhancement follows a layered architecture pattern:

1. **Presentation Layer** (React/Inertia.js)
   - Consultation interface components
   - Emergency status indicators
   - Drug formulary search interface
   - Lab test ordering interface
   - Real-time validation and feedback

2. **Application Layer** (Laravel Controllers & Services)
   - OpdService: Extended consultation workflow management
   - PrescriptionService: Medication prescription and instant dispensing logic
   - LabOrderService: Lab test ordering with priority management
   - EmergencyService: Emergency patient data retrieval

3. **Domain Layer** (Eloquent Models)
   - OpdAppointment: Consultation session management
   - OpdSoapNote: Clinical documentation
   - EmergencyPatient: Emergency patient records
   - Prescription: Medication orders
   - LabOrder: Laboratory test requests
   - DrugFormulary: Medication catalog
   - TestCatalog: Laboratory test catalog

4. **Data Layer** (MySQL Database)
   - Existing tables with new columns for priority levels and instant dispensing flags
   - Relationships between consultations, prescriptions, and lab orders

### Integration Points

- **Emergency System**: Link OpdAppointment to EmergencyPatient via patient_id
- **Pharmacy System**: Stock validation and reservation for instant dispensing
- **Laboratory System**: Priority-based test ordering
- **Billing System**: Automatic billing item creation on consultation completion

## Components and Interfaces

### 1. Enhanced Consultation Interface Component

**Location**: `resources/js/Pages/OPD/Consultation/ConsultationWorkspace.tsx`

**Props**:
```typescript
interface ConsultationWorkspaceProps {
  appointment: OpdAppointment;
  patient: Patient;
  emergencyData?: EmergencyPatient;
  soapNote: OpdSoapNote;
  prescriptions: Prescription[];
  labOrders: LabOrder[];
}
```

**Key Features**:
- Patient header with emergency indicator
- Context panel with vitals and emergency information
- SOAP note editor
- Prescription management section
- Lab order management section
- Floating action bar for consultation completion

### 2. Emergency Status Indicator Component

**Location**: `resources/js/Components/Consultation/EmergencyStatusBadge.tsx`

**Props**:
```typescript
interface EmergencyStatusBadgeProps {
  emergencyData: EmergencyPatient;
  triageAssessment?: TriageAssessment;
}
```

**Functionality**:
- Display triage priority level with color coding
- Show chief complaint and arrival information
- Provide quick access to full triage details
- Visual prominence in patient header

### 3. Drug Formulary Search Component

**Location**: `resources/js/Components/Consultation/DrugFormularySearch.tsx`

**Props**:
```typescript
interface DrugFormularySearchProps {
  onSelect: (drug: DrugFormulary) => void;
  isEmergencyPatient: boolean;
}
```

**Functionality**:
- Autocomplete search with debouncing (300ms)
- Search by generic name, brand name, or ATC code
- Display stock availability indicators
- Show drug interactions and allergy warnings
- Auto-populate dosage suggestions

### 4. Prescription Form Component

**Location**: `resources/js/Components/Consultation/PrescriptionForm.tsx`

**Props**:
```typescript
interface PrescriptionFormProps {
  drug: DrugFormulary;
  patient: Patient;
  isEmergencyPatient: boolean;
  onSave: (prescription: PrescriptionData) => void;
  onCancel: () => void;
}
```

**Functionality**:
- Dosage, frequency, duration, and quantity inputs
- Instant dispensing checkbox (emergency patients only)
- Stock validation for instant dispensing
- Drug interaction checking
- Allergy validation

### 5. Lab Test Search Component

**Location**: `resources/js/Components/Consultation/LabTestSearch.tsx`

**Props**:
```typescript
interface LabTestSearchProps {
  onSelect: (test: TestCatalog) => void;
}
```

**Functionality**:
- Autocomplete search for lab tests
- Display test details and turnaround times
- Category-based filtering

### 6. Lab Order Form Component

**Location**: `resources/js/Components/Consultation/LabOrderForm.tsx`

**Props**:
```typescript
interface LabOrderFormProps {
  test: TestCatalog;
  onSave: (labOrder: LabOrderData) => void;
  onCancel: () => void;
}
```

**Functionality**:
- Priority level selection (urgent, fast, normal)
- Display expected turnaround time for each priority
- Clinical notes input

### 7. Backend Services

#### PrescriptionService

**Location**: `app/Services/PrescriptionService.php`

**Methods**:
```php
public function createPrescription(array $data): Prescription
public function validateInstantDispensing(int $drugId, int $quantity): bool
public function reserveStock(Prescription $prescription): void
public function releaseStock(Prescription $prescription): void
public function checkDrugInteractions(string $patientId, int $drugId): array
public function checkAllergies(string $patientId, int $drugId): bool
```

#### LabOrderService

**Location**: `app/Services/LabOrderService.php`

**Methods**:
```php
public function createLabOrder(array $data): LabOrder
public function updatePriority(int $labOrderId, string $priority): LabOrder
public function getExpectedTurnaroundTime(int $testId, string $priority): int
public function submitToLaboratory(LabOrder $labOrder): void
```

#### EmergencyService

**Location**: `app/Services/EmergencyService.php`

**Methods**:
```php
public function getEmergencyDataForPatient(int $patientId): ?EmergencyPatient
public function getLatestTriageAssessment(int $emergencyPatientId): ?TriageAssessment
public function isEmergencyPatient(int $patientId): bool
```

## Data Models

### Database Schema Changes

#### 1. Prescriptions Table Enhancement

```sql
ALTER TABLE prescriptions ADD COLUMN instant_dispensing BOOLEAN DEFAULT FALSE;
ALTER TABLE prescriptions ADD COLUMN stock_reserved BOOLEAN DEFAULT FALSE;
ALTER TABLE prescriptions ADD COLUMN stock_reserved_at TIMESTAMP NULL;
```

#### 2. Lab Orders Table Enhancement

```sql
ALTER TABLE lab_orders ADD COLUMN priority ENUM('urgent', 'fast', 'normal') DEFAULT 'normal';
ALTER TABLE lab_orders ADD COLUMN expected_completion_at TIMESTAMP NULL;
ALTER TABLE lab_orders ADD COLUMN clinical_notes TEXT NULL;
```

#### 3. OPD Appointments Table (Already has emergency linkage via patient_id)

No changes needed - emergency status is determined by checking if patient has an active EmergencyPatient record.

### Model Relationships

```php
// OpdAppointment.php
public function emergencyRecord()
{
    return $this->hasOneThrough(
        EmergencyPatient::class,
        Patient::class,
        'id',
        'patient_id',
        'patient_id',
        'id'
    )->where('status', '!=', 'discharged');
}

// Prescription.php
public function drugFormulary()
{
    return $this->belongsTo(DrugFormulary::class, 'drug_id');
}

// LabOrder.php
public function testCatalog()
{
    return $this->belongsTo(TestCatalog::class, 'test_id');
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Emergency Patient Information Properties

Property 1: Emergency indicator presence
*For any* consultation opened for a patient with an active emergency record, the consultation data should include an emergency indicator flag set to true
**Validates: Requirements 1.1**

Property 2: Triage priority display
*For any* emergency patient with a triage assessment, the consultation data should include the triage priority level from the assessment
**Validates: Requirements 1.2**

Property 3: Emergency chief complaint inclusion
*For any* emergency patient, the consultation data should include the chief complaint from the emergency registration
**Validates: Requirements 1.3**

Property 4: Emergency arrival information
*For any* emergency patient, the consultation context should include both arrival time and mode of arrival
**Validates: Requirements 1.4**

Property 5: Triage vitals availability
*For any* patient with a triage assessment, the consultation data should include the triage vital signs when the assessment exists
**Validates: Requirements 1.5**

Property 6: Triage notes accessibility
*For any* emergency patient with triage assessment notes, the consultation data should include access to the full triage assessment notes
**Validates: Requirements 1.6**

### Drug Formulary Search Properties

Property 7: Multi-field drug search
*For any* drug in the formulary and any search term matching its generic name, brand name, or ATC code, the search results should include that drug
**Validates: Requirements 2.2**

Property 8: Complete search result data
*For any* drug returned in search results, the result should include drug name, strength, form, current stock availability, and stock status indicator
**Validates: Requirements 2.3**

Property 9: Prescription auto-population
*For any* selected drug, the prescription form should be populated with the drug's details including suggested dosage
**Validates: Requirements 2.4**

Property 10: Prescription field validation
*For any* prescription submission, if any of the required fields (dosage, frequency, duration, quantity) are missing, the system should reject the prescription
**Validates: Requirements 2.5**

Property 11: Drug interaction detection
*For any* patient with existing medications, when prescribing a drug that interacts with those medications, the system should generate interaction warnings
**Validates: Requirements 2.6**

Property 12: Allergy prevention
*For any* patient with known drug allergies, attempting to prescribe a drug matching those allergies should be blocked by the system
**Validates: Requirements 2.7**

### Instant Dispensing Properties

Property 13: Emergency instant dispensing availability
*For any* emergency patient, the prescription form should include the instant dispensing option
**Validates: Requirements 3.1**

Property 14: Instant dispensing stock validation
*For any* prescription marked for instant dispensing, if the requested quantity exceeds available stock, the system should reject the prescription
**Validates: Requirements 3.2**

Property 15: Stock reservation on instant dispensing
*For any* prescription marked for instant dispensing and saved, the drug's stock quantity should be reduced by the prescription quantity
**Validates: Requirements 3.3**

Property 16: Non-emergency instant dispensing restriction
*For any* non-emergency patient, the prescription form should not include the instant dispensing option
**Validates: Requirements 3.4**

Property 17: Selective instant dispensing
*For any* consultation with multiple prescriptions, each prescription should be independently markable for instant dispensing
**Validates: Requirements 3.5**

### Lab Order Properties

Property 18: Lab order priority requirement
*For any* lab order submission without a priority level specified, the system should reject the order
**Validates: Requirements 4.2**

Property 19: Priority turnaround time display
*For any* priority level option displayed, the system should include the expected turnaround time for that priority
**Validates: Requirements 4.3**

Property 20: Urgent order flagging
*For any* lab order created with urgent priority, the order should have an urgent flag set in the database
**Validates: Requirements 4.4**

Property 21: Independent lab order priorities
*For any* consultation with multiple lab orders, each lab order should be able to have a different priority level
**Validates: Requirements 4.5**

### Consultation Completion Properties

Property 22: Completion summary completeness
*For any* consultation being completed, the completion summary should include all prescriptions and lab orders created during that consultation
**Validates: Requirements 5.1**

Property 23: Instant dispensing record creation
*For any* consultation completed with instant dispensing prescriptions, dispensation records should be created for each instant dispensing prescription
**Validates: Requirements 5.2**

Property 24: Lab order submission with priority
*For any* consultation completed with lab orders, all lab orders should be submitted with their assigned priority levels intact
**Validates: Requirements 5.3**

Property 25: Billing item creation
*For any* completed consultation, billing items should be created for each prescription and each lab order
**Validates: Requirements 5.4**

Property 26: Post-completion immutability
*For any* completed consultation, attempts to modify prescriptions or lab orders should be rejected
**Validates: Requirements 5.5**

### Consultation Interface Properties

Property 27: Prescription display in consultation
*For any* consultation with prescriptions, all prescriptions created in that consultation session should be visible in the consultation interface
**Validates: Requirements 6.1**

Property 28: Lab order display with priority
*For any* consultation with lab orders, all lab orders should be displayed with their priority levels clearly indicated
**Validates: Requirements 6.2**

Property 29: Prescription editability before completion
*For any* prescription in an uncompleted consultation, all fields (dosage, frequency, duration, quantity, instant dispensing status) should be editable
**Validates: Requirements 6.3**

Property 30: Lab order editability before completion
*For any* lab order in an uncompleted consultation, the priority level and test selection should be editable
**Validates: Requirements 6.4**

Property 31: Stock release on prescription deletion
*For any* prescription with reserved stock that is deleted, the reserved stock quantity should be immediately released back to available stock
**Validates: Requirements 6.5**

### Data Integrity Properties

Property 32: Prescription encounter linkage
*For any* prescription created during a consultation, the prescription should have the encounter_id set to the consultation's appointment ID
**Validates: Requirements 7.1**

Property 33: Lab order encounter linkage
*For any* lab order created during a consultation, the lab order should have the encounter_id set to the consultation's appointment ID
**Validates: Requirements 7.2**

Property 34: Stock movement audit trail
*For any* stock reservation for instant dispensing, a stock movement record should be created with the reservation details
**Validates: Requirements 7.3**

Property 35: Consultation completion status update
*For any* consultation that is completed, the consultation status should be set to 'COMPLETED' and the completion timestamp should be recorded
**Validates: Requirements 7.4**

Property 36: Transaction rollback on error
*For any* consultation completion that encounters an error, all changes should be rolled back and the consultation should remain in its pre-completion state
**Validates: Requirements 7.5**

Property 37: Vitals widget data inclusion
*For any* consultation interface loaded, the consultation data should include current vital signs for display in the vitals widget
**Validates: Requirements 8.2**

## Error Handling

### Validation Errors

1. **Insufficient Stock for Instant Dispensing**
   - Error Code: `INSUFFICIENT_STOCK`
   - Message: "Cannot mark for instant dispensing. Available stock: {available}, Requested: {requested}"
   - Action: Prevent prescription save, display error to user

2. **Drug Allergy Conflict**
   - Error Code: `ALLERGY_CONFLICT`
   - Message: "Patient is allergic to {drug_name}. Prescription blocked."
   - Action: Prevent prescription save, display prominent warning

3. **Drug Interaction Warning**
   - Error Code: `DRUG_INTERACTION`
   - Message: "Potential interaction with {existing_drug}. {interaction_details}"
   - Action: Display warning, require doctor acknowledgment to proceed

4. **Missing Required Fields**
   - Error Code: `VALIDATION_ERROR`
   - Message: "Required fields missing: {field_list}"
   - Action: Highlight missing fields, prevent save

5. **Consultation Already Completed**
   - Error Code: `CONSULTATION_COMPLETED`
   - Message: "Cannot modify completed consultation"
   - Action: Prevent modifications, display error

### System Errors

1. **Stock Reservation Failure**
   - Error Code: `STOCK_RESERVATION_FAILED`
   - Message: "Failed to reserve stock. Please try again."
   - Action: Rollback prescription creation, log error, notify user

2. **Database Transaction Failure**
   - Error Code: `TRANSACTION_FAILED`
   - Message: "Failed to complete consultation. No changes were saved."
   - Action: Rollback all changes, maintain draft state, log error

3. **External System Failure**
   - Error Code: `EXTERNAL_SYSTEM_ERROR`
   - Message: "Failed to submit to {system_name}. Consultation saved as draft."
   - Action: Save consultation state, queue for retry, notify user

### Error Recovery Strategies

- **Auto-save**: Consultation data auto-saved every 10 seconds to prevent data loss
- **Transaction Rollback**: All database operations wrapped in transactions
- **Retry Queue**: Failed external system submissions queued for automatic retry
- **Audit Logging**: All errors logged with context for troubleshooting

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Emergency Status Detection**
   - Test with patient having active emergency record
   - Test with patient having no emergency record
   - Test with patient having discharged emergency record

2. **Stock Validation**
   - Test instant dispensing with sufficient stock
   - Test instant dispensing with insufficient stock
   - Test stock reservation and release

3. **Allergy Checking**
   - Test prescription blocked when allergy exists
   - Test prescription allowed when no allergy
   - Test with multiple allergies

4. **Priority Level Validation**
   - Test lab order creation with each priority level
   - Test lab order rejection without priority
   - Test priority modification

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **PHPUnit with Eris** (PHP property-based testing library):

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

**Tagging**: Each property-based test will be tagged with a comment explicitly referencing the correctness property in this design document using the format: `**Feature: consultation-enhancement, Property {number}: {property_text}**`

**Implementation**: Each correctness property listed above will be implemented by a SINGLE property-based test.

**Key Property Tests**:

1. **Emergency Data Inclusion** (Properties 1-6)
   - Generate random patients with/without emergency records
   - Verify consultation data includes all required emergency information

2. **Drug Search Completeness** (Properties 7-9)
   - Generate random drugs and search terms
   - Verify search returns correct matches with complete data

3. **Prescription Validation** (Properties 10-12)
   - Generate random prescriptions with various field combinations
   - Verify validation rules are enforced consistently

4. **Stock Management** (Properties 13-17)
   - Generate random prescriptions with instant dispensing
   - Verify stock is correctly validated, reserved, and released

5. **Lab Order Management** (Properties 18-21)
   - Generate random lab orders with various priorities
   - Verify priority requirements and independence

6. **Consultation Completion** (Properties 22-26)
   - Generate random consultations with prescriptions and lab orders
   - Verify completion creates all required records and enforces immutability

7. **Data Integrity** (Properties 32-37)
   - Generate random consultations with various data
   - Verify all relationships and audit trails are maintained

### Integration Testing

Integration tests will verify component interactions:

1. **End-to-End Consultation Flow**
   - Create consultation → Add prescriptions → Add lab orders → Complete consultation
   - Verify all systems updated correctly (pharmacy, lab, billing)

2. **Emergency Patient Workflow**
   - Emergency registration → Triage → Consultation with instant dispensing
   - Verify emergency data flows through entire workflow

3. **Stock Management Integration**
   - Instant dispensing → Stock reservation → Consultation completion → Dispensation
   - Verify stock levels and audit trails

4. **Billing Integration**
   - Consultation completion → Billing item creation → Invoice generation
   - Verify all charges captured correctly

### Performance Testing

Performance tests will verify system responsiveness:

1. **Drug Search Response Time**
   - Target: < 500ms for autocomplete search
   - Test with various database sizes

2. **Consultation Load Time**
   - Target: < 3 seconds for full consultation interface
   - Test with various data volumes

3. **Completion Transaction Time**
   - Target: < 2 seconds for consultation completion
   - Test with multiple prescriptions and lab orders

## Implementation Notes

### Frontend State Management

Use React Context or Zustand for consultation state management:

```typescript
interface ConsultationState {
  appointment: OpdAppointment;
  patient: Patient;
  emergencyData?: EmergencyPatient;
  soapNote: OpdSoapNote;
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  isDirty: boolean;
  lastSaved: Date;
}
```

### Auto-Save Implementation

Implement debounced auto-save using React hooks:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (isDirty) {
      saveConsultation();
    }
  }, 10000); // 10 seconds

  return () => clearTimeout(timer);
}, [consultationState, isDirty]);
```

### Stock Reservation Strategy

Implement optimistic locking for stock reservation:

1. Check stock availability
2. Reserve stock with timestamp
3. If consultation not completed within 30 minutes, release reservation
4. On completion, convert reservation to dispensation

### Priority Level Configuration

Define priority levels in configuration:

```php
// config/lab.php
return [
    'priorities' => [
        'urgent' => [
            'label' => 'Urgent',
            'turnaround_hours' => 2,
            'color' => 'red',
        ],
        'fast' => [
            'label' => 'Fast',
            'turnaround_hours' => 6,
            'color' => 'orange',
        ],
        'normal' => [
            'label' => 'Normal',
            'turnaround_hours' => 24,
            'color' => 'blue',
        ],
    ],
];
```

### Database Indexing

Add indexes for performance:

```sql
CREATE INDEX idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX idx_prescriptions_instant ON prescriptions(instant_dispensing);
CREATE INDEX idx_lab_orders_encounter ON lab_orders(encounter_id);
CREATE INDEX idx_lab_orders_priority ON lab_orders(priority);
CREATE INDEX idx_emergency_patients_patient ON emergency_patients(patient_id);
```

### Security Considerations

1. **Authorization**: Verify doctor has permission to access consultation
2. **Data Validation**: Sanitize all inputs to prevent SQL injection
3. **Audit Logging**: Log all prescription and lab order actions
4. **Stock Manipulation**: Prevent direct stock manipulation, use service layer
5. **Completed Consultation Protection**: Enforce immutability at database level

### Accessibility

1. **Keyboard Navigation**: Support tab navigation through all form fields
2. **Screen Reader Support**: Proper ARIA labels for all interactive elements
3. **Color Contrast**: Ensure triage priority colors meet WCAG AA standards
4. **Focus Management**: Maintain focus context during modal interactions
5. **Error Announcements**: Use ARIA live regions for validation errors
