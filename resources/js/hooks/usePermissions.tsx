import React from 'react';
import { usePage } from '@inertiajs/react';
import { hasPermission, type DoctorPermissions } from '@/Config/doctorPermissions';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export function usePermissions() {
  const { props } = usePage();
  const user = (props as any).auth?.user;

  const checkPermission = (
    module: keyof DoctorPermissions,
    action: string
  ): boolean => {
    if (!user || !user.role) return false;
    return hasPermission(user.role, module, action);
  };

  const canViewPatients = () => checkPermission('patients', 'view');
  const canEditPatients = () => checkPermission('patients', 'edit');
  const canAddNotes = () => checkPermission('patients', 'add_notes');
  
  const canViewAppointments = () => checkPermission('appointments', 'view');
  
  const canCreatePrescriptions = () => checkPermission('prescriptions', 'create');
  const canViewPrescriptions = () => checkPermission('prescriptions', 'view');
  const canEditPrescriptions = () => checkPermission('prescriptions', 'edit');
  
  const canOrderLabs = () => checkPermission('labs', 'order');
  const canViewLabResults = () => checkPermission('labs', 'view_results');
  
  const canAccessInpatients = () => checkPermission('inpatients', 'access_assigned_beds');
  
  const canBrowseMedicines = () => checkPermission('prescriptions', 'browse_medicines');
  
  const canBrowseMedicalRecords = () => checkPermission('medical_records', 'browse');
  const canSearchMedicalRecords = () => checkPermission('medical_records', 'search');
  const canFilterMedicalRecords = () => checkPermission('medical_records', 'filter');
  const canViewMedicalHistory = () => checkPermission('medical_records', 'view_history');
  
  const canViewReports = () => checkPermission('reports', 'view');

  return {
    user,
    checkPermission,
    // Patient permissions
    canViewPatients,
    canEditPatients,
    canAddNotes,
    // Appointment permissions
    canViewAppointments,
    // Prescription permissions
    canCreatePrescriptions,
    canViewPrescriptions,
    canEditPrescriptions,
    // Lab permissions
    canOrderLabs,
    canViewLabResults,
    // Inpatient permissions
    canAccessInpatients,
    // Medicine permissions
    canBrowseMedicines,
    // Medical Records permissions
    canBrowseMedicalRecords,
    canSearchMedicalRecords,
    canFilterMedicalRecords,
    canViewMedicalHistory,
    // Report permissions
    canViewReports,
  };
}

// Higher-order component for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredModule: keyof DoctorPermissions,
  requiredAction: string,
  fallback?: React.ComponentType<T>
) {
  return function PermissionWrappedComponent(props: T) {
    const { checkPermission } = usePermissions();
    
    if (checkPermission(requiredModule, requiredAction)) {
      return React.createElement(Component, props);
    }
    
    if (fallback) {
      return React.createElement(fallback, props);
    }
    
    return null;
  };
}

// Permission guard component
interface PermissionGuardProps {
  module: keyof DoctorPermissions;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  module, 
  action, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { checkPermission } = usePermissions();
  
  if (checkPermission(module, action)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}