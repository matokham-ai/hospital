import React from 'react';
import { Head, Link } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps } from '@/types';

interface EmergencyPatient {
  id: number;
  temp_name: string;
  chief_complaint: string;
  arrival_mode: string;
  arrival_time: string;
  status: string;
  latestTriage?: {
    triage_category: 'red' | 'yellow' | 'green' | 'black';
    gcs_total?: number;
  };
  assigned_doctor?: {
    physician_code: string;
    name: string;
  };
}

interface EmergencyIndexProps extends PageProps {
  patients: EmergencyPatient[];
}

export default function Index({ auth, patients }: EmergencyIndexProps) {
  const getTriageBadgeClass = (category: string) => {
    const classes = {
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      black: 'bg-gray-100 text-gray-800'
    };
    return classes[category as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="Emergency Department" />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Emergency Patients</h1>
            <Link
              href="/emergency"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              + New Triage
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Triage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chief Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.temp_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(patient.arrival_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">{patient.arrival_mode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.latestTriage ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getTriageBadgeClass(patient.latestTriage.triage_category)}`}>
                            {patient.latestTriage.triage_category.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not triaged</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {patient.chief_complaint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.assigned_doctor?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/emergency/${patient.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </Link>
                        {!patient.latestTriage && (
                          <Link
                            href={`/emergency/${patient.id}/triage`}
                            className="text-red-600 hover:text-red-900"
                          >
                            Triage
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No active emergency patients
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
