import React from 'react';
import { CheckCircle, AlertCircle, Clock, Activity } from 'lucide-react';

interface DashboardStatusProps {
  className?: string;
}

export default function DashboardStatus({ className = '' }: DashboardStatusProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Status
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All systems operational
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Dashboard Links
            </span>
          </div>
          <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Medicine Browser
            </span>
          </div>
          <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            Functional
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Medical Records
            </span>
          </div>
          <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            Operational
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Navigation System
            </span>
          </div>
          <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
            Updated
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          All dashboard links have been updated and are now functional
        </p>
      </div>
    </div>
  );
}
