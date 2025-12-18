# Nurse Dashboard - Live Patients Feature

## Overview
Added a comprehensive live patients section to the nurse dashboard with tabbed filtering capabilities.

## Features Added

### 1. Live Patients Section
- **Location**: Bottom of the left column on the nurse dashboard
- **Display**: Card-based patient list with detailed information
- **Search**: Real-time search by patient name, MRN, or bed number

### 2. Tab Filters
The live patients section includes 4 tabs:
- **All**: Shows all active patients
- **Critical**: Filters patients with critical status
- **IPD**: Shows only inpatient department patients
- **OPD**: Shows only outpatient department patients

Each tab displays a badge with the count of patients in that category.

### 3. Patient Card Information
Each patient card displays:
- **Header**:
  - Patient name
  - Status badge (Critical, Moderate, Stable, Observation)
  - Type badge (IPD/OPD for filtered views)

- **Demographics**:
  - Age and gender
  - Bed location
  - Department
  - MRN (Medical Record Number)

- **Vital Signs** (with icons):
  - Heart rate (HR)
  - Blood pressure (BP)
  - Oxygen saturation (SpO2)
  - Last recorded time

- **Pending Actions** (when applicable):
  - Medications due (pill icon)
  - Lab orders pending (test tube icon)
  - Procedures scheduled (syringe icon)

- **Actions**:
  - View button to navigate to patient details

### 4. Status Color Coding
- **Critical**: Red background and border
- **Moderate**: Amber/yellow badge
- **Stable**: Green badge
- **Observation**: Blue badge

### 5. Backend Implementation

#### Controller Updates (`app/Http/Controllers/Nurse/DashboardController.php`)
Added two new methods:

1. **`buildLivePatients()`**: 
   - Processes active encounters
   - Extracts patient demographics
   - Calculates current status from vitals
   - Counts pending actions
   - Determines IPD vs OPD classification

2. **`determinePatientStatus()`**:
   - Analyzes vital signs
   - Returns appropriate status level
   - Critical: SpO2 < 90, BP < 90 or > 180, HR < 40 or > 130, Temp > 39.5°C
   - Moderate: SpO2 < 95, BP < 100 or > 160, HR < 50 or > 110, Temp > 38.5°C
   - Stable: All other cases

#### Data Structure
```typescript
interface LivePatient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  status: "Critical" | "Stable" | "Moderate" | "Observation";
  department: string;
  bed: string;
  admittedAt: string;
  diagnosis: string;
  lastVitals: {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
    time: string;
  };
  pendingActions: {
    medications: number;
    labs: number;
    procedures: number;
  };
  type: "IPD" | "OPD";
}
```

## UI Components Used
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Container components
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- `Badge` - Status and count indicators
- `Button` - Action buttons
- `Input` - Search field
- `Progress` - (existing in other sections)
- Lucide icons: `Users`, `MapPin`, `Stethoscope`, `FileText`, `Heart`, `Activity`, `TrendingUp`, `Pill`, `TestTube`, `Syringe`, `Eye`, `Search`

## User Interactions
1. **Search**: Type in the search box to filter patients by name, MRN, or bed
2. **Tab Switching**: Click tabs to filter by patient category
3. **View Patient**: Click the "View" button or anywhere on the patient card to navigate to patient details
4. **Real-time Updates**: Patient counts update automatically based on search and filters

## Responsive Design
- Cards stack vertically for easy scrolling
- Compact layout optimized for dashboard viewing
- Hover effects for better interactivity
- Color-coded status for quick visual assessment

## Layout
- **Grid Display**: Patient cards are displayed in a 2x2 grid (2 columns on medium+ screens)
- **Responsive**: Single column on mobile devices
- **Balanced**: Cards fill the available space evenly

## Integration Points
- **Patient Profile**: Clicking a patient card navigates to `/patients/{id}` (Patient Profile page)
- **Live Data**: Pulls from active encounters with bed assignments
- **Vital Signs**: Shows most recent vitals recorded
- **Pending Actions**: Counts from medication administrations and lab orders

## Future Enhancements
- Real-time updates via WebSockets/Pusher
- Sorting options (by name, status, bed, etc.)
- Quick actions (record vitals, administer medication)
- Patient alerts and notifications
- Procedure tracking
- Custom filters (by ward, by nurse assignment)
