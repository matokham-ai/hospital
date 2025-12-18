# Doctor Module Permissions Implementation

## Overview
This implementation provides a comprehensive role-based access control system for the Doctor module in the Hospital Management System (HMS). It defines specific permissions, restrictions, and capabilities for doctors within the system.

## 🏗️ Architecture

### 1. **Permission Configuration** (`resources/js/Config/doctorPermissions.ts`)
- Centralized permission definitions
- Type-safe permission checking
- Helper functions for permission validation
- Navigation items based on permissions

### 2. **Permission Hook** (`resources/js/Hooks/usePermissions.tsx`)
- React hook for permission checking
- Higher-order component for conditional rendering
- Permission guard component for UI protection

### 3. **UI Components**
- **PermissionsOverview** (`resources/js/Components/Doctor/PermissionsOverview.tsx`)
- **Permissions Page** (`resources/js/Pages/Doctor/Permissions.tsx`)

## 📋 Doctor Permissions Matrix

| Module | Actions | Restrictions | Description |
|--------|---------|-------------|-------------|
| **Patients** | View, Edit, Add Notes | - | Full access to patient records and medical notes |
| **Appointments** | View | Assigned Only | View only appointments assigned to this doctor |
| **Prescriptions** | Create, View, Edit, Browse Medicines | - | Full prescription management and medicine browsing capabilities |
| **Labs** | Order, View Results | - | Order lab tests and view results |
| **Inpatients** | Access Assigned Beds | Assigned Beds Only | Access only to assigned patient beds |
| **Medical Records** | Browse, Search, Filter, View History | - | Browse patient medical history, past visits, labs, diagnoses, and admissions |
| **Reports** | View | Doctor-specific Analytics | Access to doctor-specific analytics and reports |

## 🔧 Implementation Details

### Permission Structure
```typescript
interface Permission {
  module: string;
  actions: string[];
  restrictions?: string[];
  description?: string;
}
```

### Usage Examples

#### 1. **Permission Guard Component**
```tsx
<PermissionGuard module="prescriptions" action="create">
  <button onClick={createPrescription}>
    Create Prescription
  </button>
</PermissionGuard>
```

#### 2. **Permission Hook**
```tsx
const { canCreatePrescriptions, canOrderLabs } = usePermissions();

if (canCreatePrescriptions()) {
  // Show prescription form
}
```

#### 3. **Higher-Order Component**
```tsx
const ProtectedComponent = withPermission(
  MyComponent,
  'patients',
  'edit',
  FallbackComponent
);
```

## 🎯 Key Features

### ✅ **What Doctors Can Do**
- ✅ View and edit patient medical records
- ✅ Browse available medicines and create prescriptions
- ✅ Search and filter patient medical history
- ✅ Order laboratory tests and view results
- ✅ Access assigned inpatient beds
- ✅ View their performance analytics
- ✅ Add medical notes to patient records
- ✅ Browse past visits, diagnoses, and admissions

### ❌ **Limitations & Restrictions**
- ❌ Cannot access other doctors' appointments
- ❌ Limited to assigned inpatient beds only
- ❌ Cannot access pharmacy inventory management
- ❌ Cannot modify medicine prices or stock levels
- ❌ Cannot modify system settings
- ❌ Reports limited to their data only

## 🔐 Security Features

### 1. **Role-Based Access Control**
- Permissions tied to user roles
- Automatic permission checking
- Graceful fallbacks for unauthorized access

### 2. **UI Protection**
- Components hidden based on permissions
- Actions disabled for unauthorized users
- Clear visual indicators for access levels

### 3. **Type Safety**
- TypeScript interfaces for all permissions
- Compile-time checking for permission usage
- IntelliSense support for developers

## 📱 User Interface

### 1. **Dashboard Integration**
- Permissions overview card
- Permission-protected quick actions
- Visual indicators for access levels

### 2. **Dedicated Permissions Page**
- Detailed permission breakdown
- Interactive module selection
- Usage guidelines and restrictions
- Visual permission matrix

### 3. **Visual Elements**
- Color-coded permission levels
- Icons for different modules and actions
- Status indicators (granted/restricted)
- Responsive design for all devices

## 🚀 Usage in Components

### Dashboard Quick Actions
The dashboard now shows only the actions that the doctor has permission to perform:

```tsx
// Only shows if doctor can create prescriptions
<PermissionGuard module="prescriptions" action="create">
  <PrescriptionButton />
</PermissionGuard>

// Only shows if doctor can order labs
<PermissionGuard module="labs" action="order">
  <LabOrderButton />
</PermissionGuard>
```

### Navigation Protection
Navigation items are automatically filtered based on permissions:

```typescript
const permissionBasedNav = getPermissionBasedNavigation(userRole);
// Returns only accessible navigation items
```

## 🔄 Future Enhancements

### 1. **Dynamic Permissions**
- Runtime permission updates
- Role-based permission inheritance
- Custom permission sets per doctor

### 2. **Audit Trail**
- Permission usage logging
- Access attempt tracking
- Security event monitoring

### 3. **Advanced Features**
- Time-based permissions
- Location-based restrictions
- Emergency access protocols

## 📚 File Structure

```
resources/js/
├── Config/
│   └── doctorPermissions.ts          # Permission definitions
├── Hooks/
│   └── usePermissions.tsx            # Permission hook & guards
├── Components/Doctor/
│   ├── PermissionsOverview.tsx       # Permission overview component
│   ├── MedicineBrowser.tsx           # Medicine browsing & prescription component
│   └── MedicalRecordsBrowser.tsx     # Medical records browsing component
├── Pages/Doctor/
│   ├── Dashboard.tsx                 # Updated with new features
│   ├── Permissions.tsx               # Detailed permissions page
│   ├── Medicines.tsx                 # Dedicated medicine browser page
│   └── MedicalRecords.tsx            # Dedicated medical records page
└── Layouts/
    └── HMSLayout.tsx                 # Updated with notifications & search
```

## 🎨 Design Principles

1. **Security First**: All actions require explicit permission checks
2. **User Experience**: Clear visual feedback for permission states
3. **Developer Experience**: Type-safe, easy-to-use permission system
4. **Maintainability**: Centralized permission configuration
5. **Scalability**: Easy to extend with new modules and actions

## 🧪 Testing Recommendations

1. **Unit Tests**: Test permission checking functions
2. **Integration Tests**: Test UI component behavior with different permissions
3. **E2E Tests**: Test complete user workflows with permission restrictions
4. **Security Tests**: Verify unauthorized access is properly blocked

This implementation provides a robust, scalable, and user-friendly permission system that ensures doctors have appropriate access to HMS features while maintaining security and compliance requirements.