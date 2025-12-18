import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { ImageIcon, Clock, CheckCircle } from 'lucide-react';

export default function Radiology({ reports }: any) {
    return (
        <HMSLayout>
            <Head title="Radiology Reports" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Radiology Reports</h1>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Findings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{report.patient_name}</p>
                                        <p className="text-sm text-gray-600">{report.mrn}</p>
                                    </td>
                                    <td className="px-6 py-4">{report.exam_type}</td>
                                    <td className="px-6 py-4 text-sm">{report.findings || 'Pending'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {report.status.toUpperCase()}
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
