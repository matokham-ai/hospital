import React from 'react';
import { Head, Link } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps } from '@/types';

interface TriageIndexProps extends PageProps {
    pendingTriage: Array<{
        id: number;
        appointment_number: string;
        queue_number: string;
        patient: {
            id: string;
            name: string;
            age: string;
            gender: string;
        };
        chief_complaint: string;
        checked_in_at: string;
        waiting_time: number;
    }>;
    stats: {
        pending: number;
        completed: number;
    };
}

export default function TriageIndex({ auth, pendingTriage, stats }: TriageIndexProps) {
    return (
        <HMSLayout user={auth.user}>
            <Head title="OPD Triage" />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">OPD Triage</h1>
                        <p className="text-gray-600 mt-1">Assess patients before consultation</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Triage</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">⏳</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Completed Today</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Triage List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Patients Waiting for Triage</h2>
                        </div>

                        {pendingTriage.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4">🎉</div>
                                <p className="text-gray-500 text-lg">No patients waiting for triage</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {pendingTriage.map((appointment) => (
                                    <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                        Queue #{appointment.queue_number}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {appointment.appointment_number}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {appointment.patient.name}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>{appointment.patient.age} years</span>
                                                    <span>•</span>
                                                    <span>{appointment.patient.gender}</span>
                                                    <span>•</span>
                                                    <span>Checked in: {appointment.checked_in_at}</span>
                                                    <span>•</span>
                                                    <span className="text-orange-600 font-medium">
                                                        Waiting: {appointment.waiting_time} min
                                                    </span>
                                                </div>
                                                {appointment.chief_complaint && (
                                                    <p className="text-sm text-gray-700 mt-2">
                                                        <span className="font-medium">Complaint:</span> {appointment.chief_complaint}
                                                    </p>
                                                )}
                                            </div>

                                            <Link
                                                href={`/opd/triage/${appointment.id}`}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Start Triage
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
