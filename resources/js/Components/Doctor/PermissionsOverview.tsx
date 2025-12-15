import React from 'react';
import { 
  Users, 
  Calendar, 
  Pill, 
  TestTube, 
  Bed, 
  CreditCard, 
  BarChart3,
  Check,
  Eye,
  Edit,
  Plus,
  FileText,
  Shield,
  Search,
  Filter
} from 'lucide-react';
import { doctorPermissions, type DoctorPermissions } from '@/Config/doctorPermissions';

interface PermissionsOverviewProps {
  userRole: string;
  showDetails?: boolean;
}

const moduleIcons = {
  patients: Users,
  appointments: Calendar,
  prescriptions: Pill,
  labs: TestTube,
  inpatients: Bed,
  medical_records: FileText,
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
  browse: Eye,
  search: Search,
  filter: Filter,
  view_history: FileText,
  browse_medicines: Pill,
  view_only: Eye
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'create':
    case 'edit':
    case 'order':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'view':
    case 'view_results':
    case 'view_only':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    case 'add_notes':
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
    case 'access_assigned_beds':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export default function PermissionsOverview({ userRole, showDetails = false }: PermissionsOverviewProps) {
  if (userRole !== 'Doctor') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Doctor Permissions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your access levels and capabilities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(doctorPermissions).map(([moduleKey, permission]) => {
          const IconComponent = moduleIcons[moduleKey as keyof typeof moduleIcons];
          
          return (
            <div
              key={moduleKey}
              className="p-4 rounded-lg border border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                  <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {permission.module}
                  </h4>
                  {permission.restrictions && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {permission.restrictions.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {permission.actions.map((action) => {
                  const ActionIcon = actionIcons[action as keyof typeof actionIcons] || Check;
                  
                  return (
                    <div
                      key={action}
                      className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${getActionColor(action)}`}
                    >
                      <ActionIcon className="w-3 h-3" />
                      <span className="capitalize">{action.replace('_', ' ')}</span>
                    </div>
                  );
                })}
              </div>

              {showDetails && permission.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-slate-600">
                  {permission.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Permission Guidelines
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Patient records: Full access to view, edit, and add medical notes</li>
              <li>• Appointments: View only your assigned appointments</li>
              <li>• Prescriptions: Create, modify, and browse available medicines</li>
              <li>• Lab orders: Order tests and view results for your patients</li>
              <li>• Medical records: Browse patient history, search, and filter records</li>
              <li>• Inpatients: Access limited to your assigned beds only</li>
              <li>• Reports: Access to your performance analytics only</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}