# Consultation Enhancement API Documentation

This document provides comprehensive documentation for all API endpoints added as part of the consultation enhancement feature. These endpoints enable doctors to manage prescriptions and lab orders during consultations, with support for emergency patients and instant dispensing.

## Table of Contents

1. [Authentication](#authentication)
2. [Drug Formulary Search](#drug-formulary-search)
3. [Lab Test Search](#lab-test-search)
4. [Prescription Management](#prescription-management)
5. [Lab Order Management](#lab-order-management)
6. [Consultation Completion](#consultation-completion)
7. [Error Codes](#error-codes)

---

## Authentication

All endpoints require authentication using Laravel Sanctum. Include the authentication token in the request header:

```
Authorization: Bearer {token}
```

### Required Permissions

- **Prescription Management**: `prescribe drugs` permission or `Admin` role
- **Lab Order Management**: `Doctor` or `Admin` role
- **Consultation Completion**: `complete consultations` permission or `Admin` role

---

## Drug Formulary Search

### Search Drugs

Search for medications in the drug formulary with autocomplete support.

**Endpoint:** `GET /api/drugs/search`

**Authentication:** Not required (public endpoint)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` or `query` | string | No | Search term (minimum 2 characters) |
| `form` | string | No | Filter by drug form (e.g., "tablet", "syrup") |
| `atc_code` | string | No | Filter by ATC code prefix |
| `stock_level` | string | No | Filter by stock level: `in_stock`, `low_stock`, `out_of_stock` |
| `status` | string | No | Filter by status: `active`, `discontinued` (default: `active`) |
| `limit` | integer | No | Maximum results to return (1-50, default: 10) |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Paracetamol",
    "generic_name": "Paracetamol",
    "brand_name": "Panadol",
    "atc_code": "N02BE01",
    "strength": "500mg",
    "form": "tablet",
    "unit_price": 5.00,
    "formatted_price": "KES 5.00",
    "stock_quantity": 1000,
    "stock_status": "in_stock",
    "stock_badge_color": "green",
    "full_name": "Paracetamol 500mg tablet"
  }
]
```

**Stock Status Values:**
- `in_stock`: Stock quantity > reorder level (green badge)
- `low_stock`: Stock quantity ≤ reorder level but > 0 (yellow badge)
- `out_of_stock`: Stock quantity = 0 (red badge)

**Performance:**
- Results are cached for 5 minutes
- Response time target: < 500ms
- Optimized for autocomplete with relevance-based ordering

**Example Requests:**

```bash
# Search by drug name
GET /api/drugs/search?q=paracetamol

# Search with stock filter
GET /api/drugs/search?q=amoxicillin&stock_level=in_stock

# Search by ATC code
GET /api/drugs/search?atc_code=N02B

# Limit results
GET /api/drugs/search?q=ibuprofen&limit=5
```

---

## Lab Test Search

### Search Lab Tests

Search for laboratory tests with category filtering.

**Endpoint:** `GET /api/test-catalogs/search/advanced`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` or `query` | string | No | Search term |
| `category_id` | integer | No | Filter by test category |
| `status` | string | No | Filter by status: `active`, `inactive` |
| `limit` | integer | No | Maximum results to return |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Complete Blood Count",
    "code": "CBC",
    "category_id": 1,
    "category_name": "Hematology",
    "price": 500.00,
    "turnaround_time_hours": 24,
    "turnaround_time_display": "24 hours",
    "status": "active"
  }
]
```

**Example Requests:**

```bash
# Search by test name
GET /api/test-catalogs/search/advanced?q=blood

# Filter by category
GET /api/test-catalogs/search/advanced?category_id=1

# Combined search
GET /api/test-catalogs/search/advanced?q=glucose&category_id=2
```

---

## Prescription Management

### Create Prescription

Create a new prescription for an OPD appointment.

**Endpoint:** `POST /api/opd/appointments/{id}/prescriptions`

**Authentication:** Required (Admin or `prescribe drugs` permission)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |

**Request Body:**

```json
{
  "drug_id": 1,
  "dosage": "500mg",
  "frequency": "Three times daily",
  "duration": 7,
  "quantity": 21,
  "instant_dispensing": true,
  "notes": "Take after meals"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drug_id` | integer | Yes | Drug formulary ID |
| `dosage` | string | Yes | Dosage instruction |
| `frequency` | string | Yes | Frequency of administration |
| `duration` | integer | Yes | Duration in days (minimum: 1) |
| `quantity` | integer | Yes | Total quantity (minimum: 1) |
| `instant_dispensing` | boolean | No | Mark for instant dispensing (emergency patients only) |
| `notes` | string | No | Additional notes |

**Response:** `201 Created`

```json
{
  "message": "Prescription created successfully",
  "data": {
    "id": 1,
    "encounter_id": 123,
    "patient_id": 456,
    "physician_id": 789,
    "drug_id": 1,
    "drug_name": "Paracetamol 500mg tablet",
    "dosage": "500mg",
    "frequency": "Three times daily",
    "duration": 7,
    "quantity": 21,
    "instant_dispensing": true,
    "stock_reserved": true,
    "stock_reserved_at": "2025-12-02T10:30:00Z",
    "status": "pending",
    "notes": "Take after meals",
    "created_at": "2025-12-02T10:30:00Z",
    "updated_at": "2025-12-02T10:30:00Z",
    "drug_formulary": {
      "id": 1,
      "name": "Paracetamol",
      "strength": "500mg",
      "form": "tablet",
      "stock_quantity": 979
    },
    "patient": {
      "id": 456,
      "name": "John Doe"
    },
    "physician": {
      "id": 789,
      "name": "Dr. Jane Smith"
    }
  }
}
```

**Error Responses:**

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "Unauthorized"
}
```

**422 Unprocessable Entity** - Validation errors
```json
{
  "message": "Validation failed",
  "errors": {
    "instant_dispensing": [
      "Instant dispensing is only available for emergency patients"
    ]
  }
}
```

```json
{
  "message": "Validation failed",
  "errors": {
    "drug_id": [
      "Patient is allergic to this medication. Prescription blocked."
    ]
  }
}
```

```json
{
  "message": "Validation failed",
  "errors": {
    "instant_dispensing": [
      "Insufficient stock for instant dispensing."
    ]
  }
}
```

**422 Unprocessable Entity** - Consultation completed
```json
{
  "message": "Cannot modify completed consultation"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to create prescription: {error details}"
}
```

---

### Update Prescription

Update an existing prescription for an OPD appointment.

**Endpoint:** `PUT /api/opd/appointments/{id}/prescriptions/{prescriptionId}`

**Authentication:** Required (Admin or `prescribe drugs` permission)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |
| `prescriptionId` | integer | Prescription ID |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "drug_id": 2,
  "dosage": "1000mg",
  "frequency": "Twice daily",
  "duration": 5,
  "quantity": 10,
  "instant_dispensing": false,
  "notes": "Updated instructions"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drug_id` | integer | No | Drug formulary ID |
| `dosage` | string | No | Dosage instruction |
| `frequency` | string | No | Frequency of administration |
| `duration` | integer | No | Duration in days (minimum: 1) |
| `quantity` | integer | No | Total quantity (minimum: 1) |
| `instant_dispensing` | boolean | No | Mark for instant dispensing |
| `notes` | string | No | Additional notes |

**Response:** `200 OK`

```json
{
  "message": "Prescription updated successfully",
  "data": {
    "id": 1,
    "encounter_id": 123,
    "patient_id": 456,
    "physician_id": 789,
    "drug_id": 2,
    "drug_name": "Ibuprofen 400mg tablet",
    "dosage": "1000mg",
    "frequency": "Twice daily",
    "duration": 5,
    "quantity": 10,
    "instant_dispensing": false,
    "stock_reserved": false,
    "stock_reserved_at": null,
    "status": "pending",
    "notes": "Updated instructions",
    "updated_at": "2025-12-02T11:00:00Z"
  }
}
```

**Stock Management Behavior:**
- If changing from instant dispensing to regular: Stock is released
- If changing from regular to instant dispensing: Stock is validated and reserved
- If quantity changes while instant dispensing: Old stock is released, new stock is validated and reserved
- If drug changes: Allergy check is performed, drug interactions are checked

**Error Responses:**

Same as Create Prescription endpoint, plus:

**404 Not Found** - Prescription not found
```json
{
  "message": "No query results for model [App\\Models\\Prescription]"
}
```

---

### Delete Prescription

Delete a prescription for an OPD appointment.

**Endpoint:** `DELETE /api/opd/appointments/{id}/prescriptions/{prescriptionId}`

**Authentication:** Required (Admin or `prescribe drugs` permission)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |
| `prescriptionId` | integer | Prescription ID |

**Response:** `200 OK`

```json
{
  "message": "Prescription deleted successfully"
}
```

**Behavior:**
- If prescription has reserved stock, it is automatically released
- Prescription is soft-deleted from the database

**Error Responses:**

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "Unauthorized"
}
```

**404 Not Found** - Prescription not found
```json
{
  "message": "No query results for model [App\\Models\\Prescription]"
}
```

**422 Unprocessable Entity** - Consultation completed
```json
{
  "message": "Cannot modify completed consultation"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to delete prescription: {error details}"
}
```

---

## Lab Order Management

### Create Lab Order

Create a new lab order for an OPD appointment.

**Endpoint:** `POST /api/opd/appointments/{id}/lab-orders`

**Authentication:** Required (Admin or Doctor role)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |

**Request Body:**

```json
{
  "test_id": 1,
  "priority": "urgent",
  "clinical_notes": "Patient presenting with severe symptoms"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `test_id` | integer | Yes | Test catalog ID |
| `priority` | string | Yes | Priority level: `urgent`, `fast`, or `normal` |
| `clinical_notes` | string | No | Clinical notes for the lab |

**Priority Levels:**

| Priority | Turnaround Time | Description |
|----------|----------------|-------------|
| `urgent` | 2 hours | Critical/emergency tests |
| `fast` | 6 hours | Expedited processing |
| `normal` | 24 hours | Standard processing |

**Response:** `201 Created`

```json
{
  "message": "Lab order created successfully",
  "data": {
    "id": 1,
    "encounter_id": 123,
    "patient_id": 456,
    "ordered_by": 789,
    "test_id": 1,
    "test_name": "Complete Blood Count",
    "priority": "urgent",
    "clinical_notes": "Patient presenting with severe symptoms",
    "status": "pending",
    "expected_completion_at": "2025-12-02T12:30:00Z",
    "created_at": "2025-12-02T10:30:00Z",
    "updated_at": "2025-12-02T10:30:00Z",
    "test_catalog": {
      "id": 1,
      "name": "Complete Blood Count",
      "code": "CBC",
      "price": 500.00
    },
    "patient": {
      "id": 456,
      "name": "John Doe"
    },
    "physician": {
      "id": 789,
      "name": "Dr. Jane Smith"
    }
  }
}
```

**Error Responses:**

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "Unauthorized"
}
```

**422 Unprocessable Entity** - Validation errors
```json
{
  "message": "Validation failed",
  "errors": {
    "priority": [
      "The selected priority is invalid."
    ]
  }
}
```

**422 Unprocessable Entity** - Consultation completed
```json
{
  "message": "Cannot modify completed consultation"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to create lab order: {error details}"
}
```

---

### Update Lab Order

Update an existing lab order for an OPD appointment.

**Endpoint:** `PUT /api/opd/appointments/{id}/lab-orders/{labOrderId}`

**Authentication:** Required (Admin or Doctor role)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |
| `labOrderId` | integer | Lab order ID |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "test_id": 2,
  "priority": "fast",
  "clinical_notes": "Updated clinical information"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `test_id` | integer | No | Test catalog ID |
| `test_name` | string | No | Test name (auto-populated if test_id changes) |
| `priority` | string | No | Priority level: `urgent`, `fast`, or `normal` |
| `clinical_notes` | string | No | Clinical notes for the lab |

**Response:** `200 OK`

```json
{
  "message": "Lab order updated successfully",
  "data": {
    "id": 1,
    "encounter_id": 123,
    "patient_id": 456,
    "ordered_by": 789,
    "test_id": 2,
    "test_name": "Lipid Profile",
    "priority": "fast",
    "clinical_notes": "Updated clinical information",
    "status": "pending",
    "expected_completion_at": "2025-12-02T16:30:00Z",
    "updated_at": "2025-12-02T11:00:00Z"
  }
}
```

**Behavior:**
- If priority changes, expected_completion_at is automatically recalculated
- If test_id changes, test_name is automatically updated

**Error Responses:**

Same as Create Lab Order endpoint, plus:

**404 Not Found** - Lab order not found
```json
{
  "message": "No query results for model [App\\Models\\LabOrder]"
}
```

---

### Delete Lab Order

Delete a lab order for an OPD appointment.

**Endpoint:** `DELETE /api/opd/appointments/{id}/lab-orders/{labOrderId}`

**Authentication:** Required (Admin or Doctor role)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |
| `labOrderId` | integer | Lab order ID |

**Response:** `200 OK`

```json
{
  "message": "Lab order deleted successfully"
}
```

**Error Responses:**

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "Unauthorized"
}
```

**404 Not Found** - Lab order not found
```json
{
  "message": "No query results for model [App\\Models\\LabOrder]"
}
```

**422 Unprocessable Entity** - Consultation completed
```json
{
  "message": "Cannot modify completed consultation"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to delete lab order: {error details}"
}
```

---

## Consultation Completion

### Get Consultation Summary

Get a summary of all prescriptions and lab orders before completing the consultation.

**Endpoint:** `GET /api/opd/appointments/{id}/summary`

**Authentication:** Required (Admin or `view consultations` permission)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |

**Response:** `200 OK`

```json
{
  "data": {
    "appointment": {
      "id": 123,
      "patient_id": 456,
      "doctor_id": 789,
      "status": "IN_PROGRESS",
      "appointment_date": "2025-12-02",
      "appointment_time": "10:00:00"
    },
    "prescriptions": [
      {
        "id": 1,
        "drug_name": "Paracetamol 500mg tablet",
        "dosage": "500mg",
        "frequency": "Three times daily",
        "duration": 7,
        "quantity": 21,
        "instant_dispensing": true,
        "stock_reserved": true
      },
      {
        "id": 2,
        "drug_name": "Amoxicillin 250mg capsule",
        "dosage": "250mg",
        "frequency": "Twice daily",
        "duration": 5,
        "quantity": 10,
        "instant_dispensing": false,
        "stock_reserved": false
      }
    },
    "regular_prescriptions": [
      {
        "id": 2,
        "drug_name": "Amoxicillin 250mg capsule",
        "dosage": "250mg",
        "frequency": "Twice daily",
        "duration": 5,
        "quantity": 10
      }
    ],
    "instant_dispensing_prescriptions": [
      {
        "id": 1,
        "drug_name": "Paracetamol 500mg tablet",
        "dosage": "500mg",
        "frequency": "Three times daily",
        "duration": 7,
        "quantity": 21
      }
    ],
    "lab_orders": [
      {
        "id": 1,
        "test_name": "Complete Blood Count",
        "priority": "urgent",
        "expected_completion_at": "2025-12-02T12:30:00Z",
        "clinical_notes": "Patient presenting with severe symptoms"
      }
    ],
    "total_prescriptions": 2,
    "total_lab_orders": 1
  }
}
```

**Error Responses:**

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "Unauthorized"
}
```

**404 Not Found** - Appointment not found
```json
{
  "message": "Appointment not found"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to get consultation summary: {error details}"
}
```

---

### Complete Consultation

Complete a consultation and process all prescriptions and lab orders.

**Endpoint:** `POST /api/opd/appointments/{id}/complete`

**Authentication:** Required (Admin or `complete consultations` permission)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | OPD appointment ID |

**Request Body:** None required

**Response:** `200 OK`

```json
{
  "message": "Consultation completed successfully",
  "data": {
    "appointment": {
      "id": 123,
      "patient_id": 456,
      "doctor_id": 789,
      "status": "COMPLETED",
      "completed_at": "2025-12-02T11:30:00Z"
    },
    "soap_note": {
      "id": 1,
      "subjective": "Patient complains of headache",
      "objective": "BP: 120/80, Temp: 37.2°C",
      "assessment": "Tension headache",
      "plan": "Prescribed paracetamol"
    },
    "summary": {
      "total_prescriptions": 2,
      "total_lab_orders": 1,
      "instant_dispensing_prescriptions": 1,
      "prescriptions_processed": 2,
      "lab_orders_submitted": 1
    }
  }
}
```

**What Happens During Completion:**

1. **Validation**: Checks if consultation is already completed
2. **Summary Generation**: Generates a summary of all prescriptions and lab orders
3. **Instant Dispensing**: Creates dispensation records for instant dispensing prescriptions
4. **Lab Order Submission**: Submits all lab orders to the laboratory system with priority levels
5. **Billing**: Creates billing items for all prescriptions and lab tests
6. **Status Update**: Updates consultation status to COMPLETED with timestamp
7. **Immutability**: Prevents further modifications to prescriptions and lab orders

**Transaction Handling:**
- All operations are wrapped in a database transaction
- If any error occurs, all changes are rolled back
- Consultation remains in draft state if completion fails

**Error Responses:**

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "Unauthorized"
}
```

**404 Not Found** - Appointment not found
```json
{
  "message": "Appointment not found"
}
```

**422 Unprocessable Entity** - Already completed
```json
{
  "message": "Consultation is already completed and cannot be modified."
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to complete consultation: {error details}"
}
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Description | When It Occurs |
|------|-------------|----------------|
| 200 | OK | Successful GET, PUT, DELETE requests |
| 201 | Created | Successful POST requests creating new resources |
| 400 | Bad Request | Malformed request syntax |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Validation errors or business logic violations |
| 500 | Internal Server Error | Unexpected server error |

### Application-Specific Error Codes

#### Prescription Errors

| Error Code | Message | Description |
|------------|---------|-------------|
| `INSUFFICIENT_STOCK` | "Insufficient stock for instant dispensing." | Requested quantity exceeds available stock |
| `ALLERGY_CONFLICT` | "Patient is allergic to this medication. Prescription blocked." | Drug matches patient's known allergies |
| `DRUG_INTERACTION` | "Potential interaction with {existing_drug}. {interaction_details}" | Drug interacts with patient's current medications |
| `VALIDATION_ERROR` | "Required fields missing: {field_list}" | Required prescription fields are missing |
| `CONSULTATION_COMPLETED` | "Cannot modify completed consultation" | Attempting to modify a completed consultation |
| `EMERGENCY_ONLY` | "Instant dispensing is only available for emergency patients" | Non-emergency patient attempting instant dispensing |

#### Lab Order Errors

| Error Code | Message | Description |
|------------|---------|-------------|
| `INVALID_PRIORITY` | "The selected priority is invalid." | Priority not in: urgent, fast, normal |
| `CONSULTATION_COMPLETED` | "Cannot modify completed consultation" | Attempting to modify a completed consultation |
| `VALIDATION_ERROR` | "Validation failed" | Required fields missing or invalid |

#### Consultation Completion Errors

| Error Code | Message | Description |
|------------|---------|-------------|
| `ALREADY_COMPLETED` | "Consultation is already completed and cannot be modified." | Consultation already completed |
| `TRANSACTION_FAILED` | "Failed to complete consultation. No changes were saved." | Database transaction failed, all changes rolled back |
| `STOCK_RESERVATION_FAILED` | "Failed to reserve stock. Please try again." | Stock reservation failed during completion |

### Error Response Format

All error responses follow this format:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field_name": [
      "Specific validation error for this field"
    ]
  }
}
```

For validation errors (422), the `errors` object contains field-specific error messages.

---

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse:

- **General endpoints**: 60 requests per minute per user
- **Search endpoints**: 120 requests per minute per user (optimized for autocomplete)

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1638446400
```

---

## Caching

### Drug Search Caching

Drug search results are cached for 5 minutes to improve performance:

- Cache key: `drug_search:{md5_hash_of_request_params}`
- Cache duration: 300 seconds (5 minutes)
- Cache invalidation: Automatic after 5 minutes or when drug formulary is updated

---

## Best Practices

### 1. Prescription Workflow

```javascript
// 1. Search for drug
const drugs = await fetch('/api/drugs/search?q=paracetamol');

// 2. Check patient allergies (done automatically by API)
// 3. Create prescription
const prescription = await fetch('/api/opd/appointments/123/prescriptions', {
  method: 'POST',
  body: JSON.stringify({
    drug_id: 1,
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: 7,
    quantity: 21,
    instant_dispensing: true
  })
});

// 4. Handle drug interactions if returned
if (prescription.prescription_data?.drug_interactions) {
  // Display warnings to doctor
}
```

### 2. Lab Order Workflow

```javascript
// 1. Search for test
const tests = await fetch('/api/test-catalogs/search/advanced?q=blood');

// 2. Create lab order with priority
const labOrder = await fetch('/api/opd/appointments/123/lab-orders', {
  method: 'POST',
  body: JSON.stringify({
    test_id: 1,
    priority: 'urgent',
    clinical_notes: 'Patient presenting with severe symptoms'
  })
});
```

### 3. Consultation Completion Workflow

```javascript
// 1. Get summary before completion
const summary = await fetch('/api/opd/appointments/123/summary');

// 2. Display summary to doctor for review
// 3. Complete consultation
const result = await fetch('/api/opd/appointments/123/complete', {
  method: 'POST'
});

// 4. Handle completion result
if (result.ok) {
  // Show success message
  // Redirect to completed consultations
}
```

### 4. Error Handling

```javascript
try {
  const response = await fetch('/api/opd/appointments/123/prescriptions', {
    method: 'POST',
    body: JSON.stringify(prescriptionData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 422) {
      // Validation error - show field-specific errors
      Object.keys(error.errors).forEach(field => {
        showFieldError(field, error.errors[field][0]);
      });
    } else if (response.status === 403) {
      // Permission error
      showError('You do not have permission to perform this action');
    } else {
      // Other errors
      showError(error.message);
    }
  }
} catch (error) {
  // Network error
  showError('Network error. Please check your connection.');
}
```

---

## Changelog

### Version 1.0.0 (2025-12-02)

Initial release of consultation enhancement API:

- Drug formulary search with autocomplete
- Lab test search with category filtering
- Prescription management (create, update, delete)
- Lab order management (create, update, delete)
- Consultation completion with summary
- Instant dispensing for emergency patients
- Stock reservation and management
- Allergy checking and drug interaction warnings
- Priority-based lab ordering
- Billing integration

---

## Support

For API support or to report issues:

- **Email**: support@hospital.com
- **Documentation**: https://docs.hospital.com/api
- **Issue Tracker**: https://github.com/hospital/issues

---

## License

This API is proprietary and confidential. Unauthorized use is prohibited.

---

*Last Updated: December 2, 2025*
