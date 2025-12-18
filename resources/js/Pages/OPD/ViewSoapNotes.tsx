import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps } from '@/types';

interface ViewSoapNotesProps extends PageProps {
  appointment: {
    id: number;
    appointment_number: string;
    patient: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;

    doctor: {
      id: string | number | null;
      name: string;
    } | null;

    status: string;
    chief_complaint?: string | null;
    consultation_completed_at?: string | null;
  };

  soapNote?: {
    id?: number;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    vital_signs?: Record<string, any> | null;
    created_at?: string | null;
  } | null;
}

export default function ViewSoapNotes({ auth, appointment, soapNote }: ViewSoapNotesProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title={`SOAP Notes - ${appointment.patient.first_name} ${appointment.patient.last_name}`} />
            
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">SOAP Notes</h1>
                                <p className="text-gray-600 mt-1">
                                    {appointment.patient.first_name} {appointment.patient.last_name} - {appointment.appointment_number}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => window.location.href = `/opd/consultations/${appointment.id}/soap`}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Add New
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Print
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Consultation Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Patient</label>
                                <p className="text-gray-900">{appointment.patient.first_name} {appointment.patient.last_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Doctor</label>
                                <p className="text-gray-900">{appointment.doctor.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Chief Complaint</label>
                                <p className="text-gray-900">{appointment.chief_complaint}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Completed</label>
                                <p className="text-gray-900">{formatDate(appointment.consultation_completed_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* SOAP Notes */}
                    {soapNote ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="space-y-6">
                                {/* Subjective */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Subjective</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {soapNote.subjective || 'No subjective notes recorded.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Objective */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Objective</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {soapNote.objective || 'No objective findings recorded.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Assessment */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {soapNote.assessment || 'No assessment recorded.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Plan */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {soapNote.plan || 'No treatment plan recorded.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t pt-4 mt-6">
                                    <p className="text-sm text-gray-500">
                                        Notes created on {formatDate(soapNote.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-lg font-medium">No SOAP Notes Available</p>
                                <p className="text-sm">SOAP notes were not recorded for this consultation.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HMSLayout>
    );
}
