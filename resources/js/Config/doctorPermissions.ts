// Doctor Module Permissions Configuration
export interface Permission {
  module: string;
  actions: string[];
  restrictions?: string[];
  description?: string;
}

export interface DoctorPermissions {
  patients: Permission;
  appointments: Permission;
  prescriptions: Permission;
  labs: Permission;
  inpatients: Permission;
  medical_records: Permission;
  reports: Permission;
}

export const doctorPermissions: DoctorPermissions = {
  patients: {
    module: 'patients',
    actions: ['view', 'edit', 'add_notes'],
    description: 'Full access to patient records and medical notes'
  },
  
  appointments: {
    module: 'appointments',
    actions: ['view'],
    restrictions: ['assigned_only'],
    description: 'View only appointments assigned to this doctor'
  },
  
  prescriptions: {
    module: 'prescriptions',
    actions: ['create', 'view', 'edit', 'browse_medicines'],
    description: 'Full prescription management and medicine browsing capabilities'
  },
  
  labs: {
    module: 'labs',
    actions: ['order', 'view_results'],
    description: 'Order lab tests and view results'
  },
  
  inpatients: {
    module: 'inpatients',
    actions: ['access_assigned_beds'],
    restrictions: ['assigned_beds_only'],
    description: 'Access only to assigned patient beds'
  },
  
  medical_records: {
    module: 'medical_records',
    actions: ['browse', 'search', 'filter', 'view_history'],
    description: 'Browse patient medical history, past visits, labs, diagnoses, and admissions'
  },
  
  reports: {
    module: 'reports',
    actions: ['view'],
    restrictions: ['doctor_specific_analytics'],
    description: 'Access to doctor-specific analytics and reports'
  }
};

// Helper functions for permission checking
export const hasPermission = (
  userRole: string, 
  module: keyof DoctorPermissions, 
  action: string
): boolean => {
  if (userRole !== 'Doctor') return false;
  
  const modulePermissions = doctorPermissions[module];
  return modulePermissions.actions.includes(action);
};

export const getModulePermissions = (module: keyof DoctorPermissions) => {
  return doctorPermissions[module];
};

export const getAllDoctorPermissions = () => {
  return doctorPermissions;
};

// Permission-based navigation items
export const getPermissionBasedNavigation = (userRole: string) => {
  if (userRole !== 'Doctor') return [];

  return [
    {
      name: 'Patients',
      href: '/doctor/patients',
      permissions: doctorPermissions.patients,
      enabled: hasPermission(userRole, 'patients', 'view')
    },
    {
      name: 'My Appointments',
      href: '/doctor/appointments',
      permissions: doctorPermissions.appointments,
      enabled: hasPermission(userRole, 'appointments', 'view')
    },
    {
      name: 'Prescriptions',
      href: '/doctor/prescriptions',
      permissions: doctorPermissions.prescriptions,
      enabled: hasPermission(userRole, 'prescriptions', 'create')
    },
    {
      name: 'Lab Orders',
      href: '/doctor/labs',
      permissions: doctorPermissions.labs,
      enabled: hasPermission(userRole, 'labs', 'order')
    },
    {
      name: 'Inpatient Rounds',
      href: '/doctor/inpatients',
      permissions: doctorPermissions.inpatients,
      enabled: hasPermission(userRole, 'inpatients', 'access_assigned_beds')
    },
    {
      name: 'Reports',
      href: '/doctor/reports',
      permissions: doctorPermissions.reports,
      enabled: hasPermission(userRole, 'reports', 'view')
    }
  ];
};