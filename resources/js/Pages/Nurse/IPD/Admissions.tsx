import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { UserPlus, Clock, CheckCircle } from 'lucide-react';

export default function Admissions({ admissions, stats }: any) {
    return (
        <HMSLayout>
            <Head title="Admissions" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Today's Admissions</h1>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Admissions</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <UserPlus className="h-12 w-12 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Bed</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.pending_bed}</p>
                            </div>
                            <Clock className="h-12 w-12 text-yellow-500" />
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
                </div>

                {/* Admissions List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {admissions.map((admission: any) => (
                                <tr key={admission.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{admission.patient_name}</p>
                                        <p className="text-sm text-gray-600">Age {admission.age} • {admission.gender}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{admission.admission_time}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                            {admission.admission_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{admission.diagnosis}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {admission.ward} - {admission.bed}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            admission.bed === 'Not assigned' 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {admission.bed === 'Not assigned' ? 'PENDING BED' : 'ADMITTED'}
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
