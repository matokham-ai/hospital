# Consultation Issues - Analysis & Fixes

## Issues Reported
1. ❌ Unable to add lab tests or prescribe medicine in continue consultation form
2. ❌ Lab tests added don't reflect on the patient's consultation
3. ❌ "Completion Failed: Unauthenticated" error when completing consultation

## Root Cause Analysis

### Issue 1 & 2: Lab Tests and Prescriptions Not Saving
**Problem**: The forms (`LabOrderForm.tsx` and `PrescriptionForm.tsx`) have `onSave` callbacks, but these are calling local state management (Zustand store) only. They're not making API calls to persist data to the backend.

**Current Flow**:
- Form submits → `onSave(data)` → Adds to Zustand store → ❌ No API call
- Data exists only in browser memory
- On page refresh or navigation, data is lost

**Solution**: Need to make API calls to persist data:
```typescript
// In the parent component that uses these forms:
const handleSavePrescription = async (prescriptionData) => {
  try {
    const response = await fetch(`/api/opd/appointments/${appointmentId}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
      },
      credentials: 'include', // Important for session auth
      body: JSON.stringify(prescriptionData),
    });
    
    if (response.ok) {
      const data = await response.json();
      addPrescription(data.prescription); // Update local state
    }
  } catch (error) {
    console.error('Failed to save prescription:', error);
  }
};
```

### Issue 3: "Unauthenticated" Error on Completion
**Problem**: The API routes use `auth:sanctum` middleware, but the frontend requests might not be including proper authentication credentials.

**Current Setup**:
- Routes: `routes/api.php` line 128 - has `auth:sanctum` middleware ✅
- Controller: `OpdConsultationController.php` - checks `$request->user()` ✅
- Frontend: Missing `credentials: 'include'` in fetch requests ❌

**Solution**: Ensure all API calls include credentials:
```typescript
fetch('/api/opd/appointments/123/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
  },
  credentials: 'include', // This is critical!
  body: JSON.stringify({}),
});
```

## Files That Need Updates

### 1. Find the Consultation Page Component
Location: Likely in `resources/js/Pages/OPD/Consultations.tsx` or similar

**Changes Needed**:
- Add API call functions for saving prescriptions
- Add API call functions for saving lab orders
- Add proper error handling
- Include `credentials: 'include'` in all fetch calls

### 2. Update Form Usage
The forms themselves are fine, but their parent components need to:
- Make API calls in the `onSave` handlers
- Handle loading states
- Show success/error messages
- Update local state after successful API calls

## Quick Fix Steps

1. **Add CSRF token to all API calls**:
```typescript
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
```

2. **Include credentials in fetch**:
```typescript
credentials: 'include'
```

3. **Make API calls for prescriptions**:
```typescript
POST /api/opd/appointments/{id}/prescriptions
```

4. **Make API calls for lab orders**:
```typescript
POST /api/opd/appointments/{id}/lab-orders
```

5. **Complete consultation with auth**:
```typescript
POST /api/opd/appointments/{id}/complete
```

## Testing Checklist
- [ ] Add a prescription → Check database for new record
- [ ] Add a lab order → Check database for new record
- [ ] Refresh page → Data should persist
- [ ] Complete consultation → Should succeed without "Unauthenticated" error
- [ ] Check browser console for any errors
- [ ] Verify CSRF token is present in page HTML

## Next Steps
1. Locate the consultation page component
2. Add API integration for prescription/lab order saving
3. Test the complete flow
4. Add proper error handling and user feedback
