import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { LogOut, Clock, CheckCircle, FileText } from 'lucide-react';

export default function Discharges({ discharges, stats }: any) {
    return (
        <HMSLayout>
            <Head title="Discharges" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Planned Discharges</h1>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Planned Today</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.planned}</p>
                            </div>
                            <Clock className="h-12 w-12 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                            </div>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Instructions</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.pending_instructions}</p>
                            </div>
                            <FileText className="h-12 w-12 text-yellow-500" />
                        </div>
                    </div>
                </div>

                {/* Discharges List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LOS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {discharges.map((discharge: any) => (
                                <tr key={discharge.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{discharge.patient_name}</p>
                                        <p className="text-sm text-gray-600">Age {discharge.age} • {discharge.gender}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {discharge.ward} - {discharge.bed}
                                    </td>
                                    <td className="px-6 py-4 text-sm">{discharge.admission_date}</td>
                                    <td className="px-6 py-4 text-sm">{discharge.los} days</td>
                                    <td className="px-6 py-4 text-sm">{discharge.diagnosis}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            discharge.discharge_instructions_ready
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {discharge.discharge_instructions_ready ? 'READY' : 'PENDING'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </HMSLayout>
    );
}
