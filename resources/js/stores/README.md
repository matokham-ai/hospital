# Consultation State Management

This directory contains the Zustand store for managing consultation state across the application.

## Overview

The consultation state management system provides a centralized store for managing all consultation-related data, including:

- Appointment and patient information
- Emergency patient data and triage assessments
- SOAP notes
- Prescriptions
- Lab orders
- Dirty state tracking (unsaved changes)
- Last saved timestamp

**Requirement 6.6**: This implements the consultation state management requirement with isDirty flag for tracking unsaved changes and lastSaved timestamp.

## Store Structure

### State

```typescript
{
  // Core data
  appointment: Appointment | null;
  patient: Patient | null;
  emergencyData: EmergencyPatient | null;
  triageAssessment: TriageAssessment | null;
  soapNote: SoapNote;
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  
  // State tracking
  isDirty: boolean;              // Tracks unsaved changes
  lastSaved: Date | null;        // Timestamp of last save
  isAutoSaving: boolean;         // Indicates auto-save in progress
}
```

## Usage

### 1. Initialize the Store

Use the `useConsultationInit` hook to initialize the store with server data when the consultation page loads:

```typescript
import { useConsultationInit } from '@/hooks/consultation';

function SoapNotes({ appointment, soapNote, emergencyData, prescriptions, labOrders }) {
  // Initialize store with server data
  useConsultationInit({
    appointment,
    soapNote,
    emergencyData,
    prescriptions,
    labOrders,
  });
  
  // ... rest of component
}
```

### 2. Access Consultation Data

Use the `useConsultationData` hook to access all consultation data:

```typescript
import { useConsultationData } from '@/hooks/consultation';

function MyComponent() {
  const {
    appointment,
    patient,
    emergencyData,
    soapNote,
    prescriptions,
    labOrders,
    isEmergencyPatient,
    isConsultationCompleted,
  } = useConsultationData();
  
  // Use the data
}
```

### 3. Manage Prescriptions

Use the `useConsultationPrescriptions` hook to manage prescriptions:

```typescript
import { useConsultationPrescriptions } from '@/hooks/consultation';

function PrescriptionManager() {
  const {
    prescriptions,
    addPrescription,
    updatePrescription,
    removePrescription,
  } = useConsultationPrescriptions();
  
  const handleAddPrescription = (prescription) => {
    addPrescription(prescription);
  };
  
  const handleUpdatePrescription = (id, updates) => {
    updatePrescription(id, updates);
  };
  
  const handleRemovePrescription = (id) => {
    removePrescription(id);
  };
}
```

### 4. Manage Lab Orders

Use the `useConsultationLabOrders` hook to manage lab orders:

```typescript
import { useConsultationLabOrders } from '@/hooks/consultation';

function LabOrderManager() {
  const {
    labOrders,
    addLabOrder,
    updateLabOrder,
    removeLabOrder,
  } = useConsultationLabOrders();
  
  // Similar usage to prescriptions
}
```

### 5. Manage SOAP Notes

Use the `useConsultationSoapNote` hook to manage SOAP notes:

```typescript
import { useConsultationSoapNote } from '@/hooks/consultation';

function SoapNoteEditor() {
  const { soapNote, setSoapNote } = useConsultationSoapNote();
  
  const handleSubjectiveChange = (value) => {
    setSoapNote({ subjective: value });
  };
  
  // This automatically marks the state as dirty
}
```

### 6. Track State Changes

Use the `useConsultationState` hook to track dirty state and last saved:

```typescript
import { useConsultationState } from '@/hooks/consultation';

function SaveIndicator() {
  const {
    isDirty,
    lastSaved,
    isAutoSaving,
    markClean,
    updateLastSaved,
  } = useConsultationState();
  
  const handleSave = async () => {
    // Save to server
    await saveToServer();
    
    // Update state
    updateLastSaved(); // Sets lastSaved to now and isDirty to false
  };
  
  return (
    <div>
      {isDirty && <span>Unsaved changes</span>}
      {lastSaved && <span>Last saved: {lastSaved.toLocaleString()}</span>}
    </div>
  );
}
```

### 7. Display State Indicator

Use the `ConsultationStateIndicator` component to show save status:

```typescript
import ConsultationStateIndicator from '@/Components/Consultation/ConsultationStateIndicator';

function ConsultationHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1>Consultation</h1>
      <ConsultationStateIndicator />
    </div>
  );
}
```

## Benefits

1. **Centralized State**: All consultation data in one place
2. **Type Safety**: Full TypeScript support
3. **Automatic Dirty Tracking**: Changes automatically mark state as dirty
4. **Easy Integration**: Simple hooks for accessing and updating state
5. **Performance**: Zustand provides efficient re-renders
6. **Cleanup**: Automatic state reset on unmount

## Best Practices

1. **Initialize Once**: Call `useConsultationInit` only once at the top level of your consultation page
2. **Use Specific Hooks**: Use specialized hooks (`useConsultationPrescriptions`, etc.) instead of accessing the store directly
3. **Update Last Saved**: Always call `updateLastSaved()` after successfully saving to the server
4. **Handle Errors**: If save fails, don't update `lastSaved` to keep the dirty state
5. **Clean Up**: The store automatically resets on unmount, but you can manually call `reset()` if needed

## Example: Complete Integration

```typescript
import React from 'react';
import {
  useConsultationInit,
  useConsultationData,
  useConsultationState,
  useConsultationPrescriptions,
} from '@/hooks/consultation';
import ConsultationStateIndicator from '@/Components/Consultation/ConsultationStateIndicator';

export default function SoapNotes({ appointment, soapNote, prescriptions }) {
  // Initialize store
  useConsultationInit({ appointment, soapNote, prescriptions });
  
  // Access data
  const { isEmergencyPatient } = useConsultationData();
  const { isDirty, updateLastSaved } = useConsultationState();
  const { addPrescription } = useConsultationPrescriptions();
  
  const handleSave = async () => {
    try {
      await saveToServer();
      updateLastSaved();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };
  
  return (
    <div>
      <div className="header">
        <h1>Consultation</h1>
        <ConsultationStateIndicator />
      </div>
      
      {/* Rest of your component */}
      
      <button onClick={handleSave} disabled={!isDirty}>
        Save
      </button>
    </div>
  );
}
```

## Testing

The store can be easily tested by importing and using it directly:

```typescript
import { useConsultationStore } from '@/stores/consultationStore';

test('should add prescription', () => {
  const { addPrescription, prescriptions } = useConsultationStore.getState();
  
  const prescription = { id: 1, drug_name: 'Test Drug', ... };
  addPrescription(prescription);
  
  expect(useConsultationStore.getState().prescriptions).toContain(prescription);
});
```
