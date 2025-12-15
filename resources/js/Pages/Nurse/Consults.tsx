import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { PhoneCall, Clock, CheckCircle } from 'lucide-react';

export default function Consults({ consults, statistics }: any) {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const { data, setData, post, reset } = useForm({
        patient_id: '',
        specialty: '',
        urgency: 'routine',
        reason: '',
        clinical_summary: '',
    });

    const submitRequest = (e: React.FormEvent) => {
        e.preventDefault();
        post('/nurse/consults/request', {
            onSuccess: () => {
                setShowRequestModal(false);
                reset();
            },
        });
    };

    return (
        <HMSLayout>
            <Head title="Consult Requests" />

            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Consult Requests</h1>
                        <p className="text-gray-600 mt-1">Request and track specialist consultations</p>
                    </div>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Request Consult
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.pending}</p>
                            </div>
                            <Clock className="h-12 w-12 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.in_progress}</p>
                            </div>
                            <PhoneCall className="h-12 w-12 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completed Today</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.completed_today}</p>
                            </div>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Consults List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {consults.map((consult: any) => (
                                <tr key={consult.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{consult.patient_name}</p>
                                        <p className="text-sm text-gray-600">{consult.mrn}</p>
                                        <p className="text-sm text-gray-600">{consult.location}</p>
                                    </td>
                                    <td className="px-6 py-4">{consult.specialty}</td>
                                    <td className="px-6 py-4 text-sm">{consult.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            consult.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {consult.urgency.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            consult.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {consult.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">Request Consult</h2>
                        <form onSubmit={submitRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Patient ID *</label>
                                <input
                                    type="number"
                                    value={data.patient_id}
                                    onChange={e => setData('patient_id', e.target.value)}
                                    className="w-full border rounded-lg p-3"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Specialty *</label>
                                <select
                                    value={data.specialty}
                                    onChange={e => setData('specialty', e.target.value)}
                                    className="w-full border rounded-lg p-3"
                                    required
                                >
                                    <option value="">Select specialty</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="Orthopedics">Orthopedics</option>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Surgery">Surgery</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Urgency *</label>
                                <select
                                    value={data.urgency}
                                    onChange={e => setData('urgency', e.target.value)}
                                    className="w-full border rounded-lg p-3"
                                >
                                    <option value="stat">STAT</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="routine">Routine</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Reason *</label>
                                <input
                                    type="text"
                                    value={data.reason}
                                    onChange={e => setData('reason', e.target.value)}
                                    className="w-full border rounded-lg p-3"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Clinical Summary *</label>
                                <textarea
                                    value={data.clinical_summary}
                                    onChange={e => setData('clinical_summary', e.target.value)}
                                    rows={4}
                                    className="w-full border rounded-lg p-3"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </HMSLayout>
    );
}
