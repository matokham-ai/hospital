import React, { useState } from 'react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Head } from '@inertiajs/react';
import { 
  Shield, 
  Info, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Calendar,
  Pill,
  TestTube,
  Bed,
  CreditCard,
  BarChart3,
  Eye,
  Edit,
  Plus,
  FileText
} from 'lucide-react';
import { doctorPermissions, hasPermission, type DoctorPermissions } from '@/Config/doctorPermissions';

interface DoctorPermissionsPageProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

const moduleIcons = {
  patients: Users,
  appointments: Calendar,
  prescriptions: Pill,
  labs: TestTube,
  inpatients: Bed,
  billing: CreditCard,
  reports: BarChart3
};

const actionIcons = {
  view: Eye,
  edit: Edit,
  create: Plus,
  add_notes: FileText,
  order: Plus,
  view_results: Eye,
  access_assigned_beds: Bed,
  view_only: Eye
};

export default function DoctorPermissionsPage({
  userName,
  userEmail,
  userRole
}: DoctorPermissionsPageProps) {
  const [selectedModule, setSelectedModule] = useState<keyof DoctorPermissions | null>(null);

  const getPermissionStatus = (module: keyof DoctorPermissions, action: string) => {
    return hasPermission(userRole || 'Doctor', module, action);
  };

  const getModuleColor = (moduleKey: string) => {
    const colors = {
      patients: 'blue',
      appointments: 'green',
      prescriptions: 'purple',
      labs: 'orange',
      inpatients: 'red',
      billing: 'yellow',
      reports: 'indigo'
    };
    return colors[moduleKey as keyof typeof colors] || 'gray';
  };

  return (
    <HMSLayout 
      user={{ name: userName || 'Doctor', email: userEmail || '', role: userRole || 'Doctor' }}
      breadcrumbs={[
        { name: 'Dashboard', href: '/doctor/dashboard' },
        { name: 'Permissions' }
      ]}
    >
      <Head title="Doctor Permissions - MediCare HMS" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Doctor Permissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review your access levels and system capabilities
              </p>
            </div>
          </div>

          {/* Permission Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(doctorPermissions).map(([moduleKey, permission]) => {
              const IconComponent = moduleIcons[moduleKey as keyof typeof moduleIcons];
              const color = getModuleColor(moduleKey);
              const hasAnyPermission = permission.actions.some(action => 
                getPermissionStatus(moduleKey as keyof DoctorPermissions, action)
              );

              return (
                <div
                  key={moduleKey}
                  onClick={() => setSelectedModule(moduleKey as keyof DoctorPermissions)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedModule === moduleKey
                      ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  } bg-white dark:bg-slate-800`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                      <IconComponent className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                    {hasAnyPermission ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white capitalize mb-2">
                    {permission.module}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {permission.actions.map((action) => (
                      <span
                        key={action}
                        className={`px-2 py-1 text-xs rounded-full ${
                          getPermissionStatus(moduleKey as keyof DoctorPermissions, action)
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {action.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {permission.restrictions && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{permission.restrictions.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Permission View */}
          {selectedModule && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg bg-${getModuleColor(selectedModule)}-100 dark:bg-${getModuleColor(selectedModule)}-900/30`}>
                  {React.createElement(moduleIcons[selectedModule], {
                    className: `w-6 h-6 text-${getModuleColor(selectedModule)}-600 dark:text-${getModuleColor(selectedModule)}-400`
                  })}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                    {selectedModule} Permissions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {doctorPermissions[selectedModule].description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Available Actions</h4>
                  <div className="space-y-3">
                    {doctorPermissions[selectedModule].actions.map((action) => {
                      const ActionIcon = actionIcons[action as keyof typeof actionIcons] || CheckCircle;
                      const hasPermission = getPermissionStatus(selectedModule, action);
                      
                      return (
                        <div
                          key={action}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            hasPermission
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          }`}
                        >
                          <ActionIcon className={`w-5 h-5 ${
                            hasPermission ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`} />
                          <div className="flex-1">
                            <p className={`font-medium ${
                              hasPermission ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                            }`}>
                              {action.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className={`text-sm ${
                              hasPermission ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                            }`}>
                              {hasPermission ? 'Granted' : 'Not Available'}
                            </p>
                          </div>
                          {hasPermission ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Restrictions & Notes</h4>
                  <div className="space-y-4">
                    {doctorPermissions[selectedModule].restrictions && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <h5 className="font-medium text-amber-900 dark:text-amber-100">Restrictions</h5>
                        </div>
                        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                          {doctorPermissions[selectedModule].restrictions!.map((restriction, index) => (
                            <li key={index}>• {restriction.replace('_', ' ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h5 className="font-medium text-blue-900 dark:text-blue-100">Usage Guidelines</h5>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {getUsageGuideline(selectedModule)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Permission Guidelines */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Doctor Role Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">What You Can Do</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View and edit patient medical records
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Create and manage prescriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Order laboratory tests and view results
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Access assigned inpatient beds
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View your performance analytics
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Limitations</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Cannot access other doctors' appointments
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Limited to assigned inpatient beds only
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Billing access is view-only (if enabled)
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Cannot modify system settings
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Reports limited to your data only
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </HMSLayout>
  );
}

function getUsageGuideline(module: keyof DoctorPermissions): string {
  const guidelines = {
    patients: "Access patient records responsibly. Always maintain patient confidentiality and only access records for patients under your care.",
    appointments: "You can only view appointments assigned to you. Contact administration to modify appointment schedules.",
    prescriptions: "Follow hospital protocols when prescribing medications. Verify patient allergies and drug interactions.",
    labs: "Order tests judiciously based on clinical need. Review results promptly and document findings in patient records.",
    inpatients: "Access is limited to beds assigned to you. Coordinate with nursing staff for patient care updates.",
    billing: "Billing information is for reference only. Contact billing department for any discrepancies or questions.",
    reports: "Analytics show your performance metrics only. Use data to improve patient care and clinical outcomes."
  };
  
  return guidelines[module];
}
