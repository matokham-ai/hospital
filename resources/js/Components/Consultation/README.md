# Consultation Components

This directory contains React components for the enhanced consultation workflow.

## EmergencyStatusBadge

A prominent emergency indicator component that displays triage priority with color coding and detailed emergency information in a tooltip.

### Features

- **Triage Priority Color Coding** (Requirements 1.1, 1.2)
  - Critical: Red (bg-red-600)
  - Urgent: Orange (bg-orange-500)
  - Semi-Urgent: Yellow (bg-yellow-500)
  - Non-Urgent: Green (bg-green-500)
  - No Triage: Yellow (default emergency indicator)

- **Tooltip with Emergency Details**
  - Chief complaint
  - Arrival time and mode
  - Triage priority badge
  - Triage vital signs (temperature, BP, HR, RR, SpO2, GCS)
  - Assessment notes

- **Prominent Styling**
  - Animated pulse effect for visibility
  - Large, bold text with icon
  - Shadow and border for prominence
  - Designed for patient header placement

### Usage

```tsx
import EmergencyStatusBadge from '@/Components/Consultation/EmergencyStatusBadge';

// Basic usage with triage assessment
<EmergencyStatusBadge
    emergencyData={emergencyPatient}
    triageAssessment={triageAssessment}
/>

// Without triage assessment
<EmergencyStatusBadge
    emergencyData={emergencyPatient}
/>

// With custom className
<EmergencyStatusBadge
    emergencyData={emergencyPatient}
    triageAssessment={triageAssessment}
    className="ml-4"
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `emergencyData` | `EmergencyPatient` | Yes | Emergency patient data including chief complaint, arrival info |
| `triageAssessment` | `TriageAssessment` | No | Triage assessment with priority level and vitals |
| `className` | `string` | No | Additional CSS classes for customization |

### Type Definitions

```typescript
interface EmergencyPatient {
    id: number;
    patient_id: number;
    chief_complaint: string;
    arrival_mode: string;
    arrival_time: string;
    status: 'WAITING' | 'IN_TRIAGE' | 'IN_TREATMENT' | 'ADMITTED' | 'DISCHARGED';
    // ... other fields
}

interface TriageAssessment {
    id: number;
    emergency_patient_id: number;
    triage_category: 'CRITICAL' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT';
    temperature?: number;
    blood_pressure?: string;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    gcs_total?: number;
    assessment_notes?: string;
    // ... other fields
}
```

### Examples

See `EmergencyStatusBadge.example.tsx` for comprehensive usage examples including:
- Critical emergency patient with full triage data
- Urgent emergency patient
- Emergency patient without triage assessment
- Usage in patient header
- All priority levels comparison

### Testing

Run tests with:
```bash
npm run test -- tests/Components/Consultation/EmergencyStatusBadge.test.tsx --run
```

### Dependencies

- `@/Components/ui/badge` - Base badge component
- `@/Components/ui/tooltip` - Tooltip components from Radix UI
- `lucide-react` - Icons (AlertCircle, Clock, Ambulance)
- `class-variance-authority` - Variant styling
- `@/lib/utils` - cn utility for className merging

### Accessibility

- Tooltip trigger is keyboard accessible
- ARIA labels provided by Radix UI tooltip
- Color contrast meets WCAG AA standards
- Screen reader friendly with semantic HTML

### Design Decisions

1. **Pulse Animation**: Added to draw immediate attention to emergency status
2. **Color Coding**: Follows standard medical triage color conventions
3. **Tooltip Content**: Comprehensive emergency details without cluttering the UI
4. **Icon Usage**: AlertCircle for emergency, Clock for time, Ambulance for arrival mode
5. **Responsive Design**: Tooltip adjusts position based on available space

---

## CompletionSummaryModal

A modal dialog that displays a comprehensive summary of all prescriptions and lab orders before completing a consultation. Shows instant dispensing prescriptions separately and requires confirmation.

### Features

- **Comprehensive Summary Display** (Requirement 5.1)
  - All prescriptions with full details
  - All lab orders with priority levels
  - Separate section for instant dispensing prescriptions
  - Summary statistics

- **Instant Dispensing Highlight**
  - Dedicated red-themed section for emergency instant dispensing
  - Clear visual distinction from regular prescriptions
  - Prominent warning about immediate dispensing

- **Lab Order Priority Display**
  - Color-coded priority badges (urgent, fast, normal)
  - Priority icons for quick identification
  - Clinical notes display

- **Loading State**
  - Animated spinner during completion
  - Disabled buttons to prevent double submission
  - Clear feedback to user

- **Confirmation Flow**
  - Warning about immutability after completion
  - Cancel and confirm actions
  - Summary statistics for quick review

### Usage

```tsx
import CompletionSummaryModal from '@/Components/Consultation/CompletionSummaryModal';

// Basic usage
<CompletionSummaryModal
    isOpen={isModalOpen}
    onClose={handleClose}
    onConfirm={handleConfirm}
    prescriptions={prescriptions}
    labOrders={labOrders}
    isLoading={isCompleting}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `onConfirm` | `() => void` | Yes | Callback when completion is confirmed |
| `prescriptions` | `Prescription[]` | Yes | Array of prescriptions to display |
| `labOrders` | `LabOrder[]` | Yes | Array of lab orders to display |
| `isLoading` | `boolean` | Yes | Loading state during completion |

### Type Definitions

```typescript
interface Prescription {
    id: number;
    drug_id: number;
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: number;
    quantity: number;
    instant_dispensing: boolean;
}

interface LabOrder {
    id: number;
    test_id: number;
    test_name: string;
    priority: 'urgent' | 'fast' | 'normal';
    clinical_notes?: string;
}
```

### Examples

See `CompletionSummaryModal.example.tsx` for comprehensive usage examples including:
- Modal with instant dispensing prescriptions
- Modal with regular prescriptions
- Modal with lab orders at different priorities
- Loading state during completion
- Empty state (no prescriptions or lab orders)

### Visual Design

#### Instant Dispensing Section
- Red theme (bg-red-50, border-red-200)
- AlertCircle icon with red color
- Emergency emoji (🚨) for visual prominence
- White cards with red borders for each prescription

#### Regular Prescriptions Section
- Blue theme (bg-blue-50, border-blue-200)
- Pill emoji (💊) for visual identification
- White cards with blue borders

#### Lab Orders Section
- Purple theme (bg-purple-50, border-purple-200)
- Test tube emoji (🧪) for visual identification
- Priority badges with color coding:
  - Urgent: Red (bg-red-100, text-red-700)
  - Fast: Orange (bg-orange-100, text-orange-700)
  - Normal: Blue (bg-blue-100, text-blue-700)

#### Summary Statistics
- Gray theme (bg-gray-50, border-gray-200)
- Grid layout for key metrics
- Large bold numbers for quick scanning

#### Warning Section
- Yellow theme (bg-yellow-50, border-yellow-200)
- AlertCircle icon
- Important notice about immutability

### Accessibility

- Dialog managed by Radix UI for proper focus management
- Keyboard navigation support (Escape to close)
- ARIA labels provided by Dialog components
- Color contrast meets WCAG AA standards
- Screen reader friendly with semantic HTML
- Disabled state clearly indicated

### Dependencies

- `@/Components/ui/dialog` - Dialog components from Radix UI
- `@/Components/ui/button` - Button component
- `lucide-react` - Icons (CheckCircle2, Clock, AlertCircle, Loader2)
- `@/lib/utils` - cn utility for className merging

### Design Decisions

1. **Separate Instant Dispensing**: Emergency prescriptions shown in dedicated section with red theme for immediate attention
2. **Color Coding**: Different colors for prescriptions (blue), instant dispensing (red), and lab orders (purple) for quick visual scanning
3. **Summary Statistics**: Quick overview at a glance with key metrics
4. **Warning Message**: Clear notice about immutability to prevent user confusion
5. **Loading State**: Prevents double submission and provides clear feedback
6. **Empty State**: Handles edge case where consultation has no prescriptions or lab orders
7. **Responsive Layout**: Grid layouts adapt to screen size for mobile compatibility
