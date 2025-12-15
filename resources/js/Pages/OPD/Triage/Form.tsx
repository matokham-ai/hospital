import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps } from '@/types';

interface TriageFormProps extends PageProps {
    appointment: {
        id: number;
        appointment_number: string;
        patient: {
            id: string;
            name: string;
            age: string;
            gender: string;
        };
        chief_complaint: string;
        triage_status: string;
        temperature?: number;
        blood_pressure?: string;
        heart_rate?: number;
        respiratory_rate?: number;
        oxygen_saturation?: number;
        weight?: number;
        height?: number;
        triage_notes?: string;
    };
}

export default function TriageForm({ auth, appointment }: TriageFormProps) {
    const { data, setData, post, processing, errors } = useForm({
        temperature: appointment.temperature || '',
        blood_pressure: appointment.blood_pressure || '',
        heart_rate: appointment.heart_rate || '',
        respiratory_rate: appointment.respiratory_rate || '',
        oxygen_saturation: appointment.oxygen_saturation || '',
        weight: appointment.weight || '',
        height: appointment.height || '',
        pain_level: appointment.pain_level || '',
        triage_notes: appointment.triage_notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/opd/triage/${appointment.id}`);
    };

    const handleSkip = () => {
        if (confirm('Are you sure you want to skip triage for this patient?')) {
            router.post(`/opd/triage/${appointment.id}/skip`);
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title={`Triage - ${appointment.patient.name}`} />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Patient Triage</h1>
                                <p className="text-gray-600 mt-1">{appointment.appointment_number}</p>
                            </div>
                            <button
                                onClick={() => window.history.back()}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Name</label>
                                <p className="text-gray-900 font-medium">{appointment.patient.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Age</label>
                                <p className="text-gray-900">{appointment.patient.age} years</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Gender</label>
                                <p className="text-gray-900">{appointment.patient.gender}</p>
                            </div>
                            {appointment.chief_complaint && (
                                <div className="md:col-span-3">
                                    <label className="text-sm font-medium text-gray-600">Chief Complaint</label>
                                    <p className="text-gray-900">{appointment.chief_complaint}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Triage Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Vital Signs</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Temperature */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Temperature (°C)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.temperature}
                                    onChange={(e) => setData('temperature', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="36.5"
                                />
                                {errors.temperature && (
                                    <p className="text-red-600 text-sm mt-1">{errors.temperature}</p>
                                )}
                            </div>

                            {/* Blood Pressure */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Blood Pressure (mmHg)
                                </label>
                                <input
                                    type="text"
                                    value={data.blood_pressure}
                                    onChange={(e) => setData('blood_pressure', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="120/80"
                                />
                                {errors.blood_pressure && (
                                    <p className="text-red-600 text-sm mt-1">{errors.blood_pressure}</p>
                                )}
                            </div>

                            {/* Heart Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Heart Rate (bpm)
                                </label>
                                <input
                                    type="number"
                                    value={data.heart_rate}
                                    onChange={(e) => setData('heart_rate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="72"
                                />
                                {errors.heart_rate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.heart_rate}</p>
                                )}
                            </div>

                            {/* Respiratory Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Respiratory Rate (breaths/min)
                                </label>
                                <input
                                    type="number"
                                    value={data.respiratory_rate}
                                    onChange={(e) => setData('respiratory_rate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="16"
                                />
                                {errors.respiratory_rate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.respiratory_rate}</p>
                                )}
                            </div>

                            {/* Oxygen Saturation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Oxygen Saturation (%)
                                </label>
                                <input
                                    type="number"
                                    value={data.oxygen_saturation}
                                    onChange={(e) => setData('oxygen_saturation', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="98"
                                />
                                {errors.oxygen_saturation && (
                                    <p className="text-red-600 text-sm mt-1">{errors.oxygen_saturation}</p>
                                )}
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.weight}
                                    onChange={(e) => setData('weight', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="70"
                                />
                                {errors.weight && (
                                    <p className="text-red-600 text-sm mt-1">{errors.weight}</p>
                                )}
                            </div>

                            {/* Height */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.height}
                                    onChange={(e) => setData('height', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="170"
                                />
                                {errors.height && (
                                    <p className="text-red-600 text-sm mt-1">{errors.height}</p>
                                )}
                            </div>

                            {/* Pain Level */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pain Level (0-10 scale)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={data.pain_level}
                                        onChange={(e) => setData('pain_level', e.target.value)}
                                        className="flex-1"
                                    />
                                    <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                                        {data.pain_level || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>No pain</span>
                                    <span>Moderate</span>
                                    <span>Severe</span>
                                </div>
                                {errors.pain_level && (
                                    <p className="text-red-600 text-sm mt-1">{errors.pain_level}</p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Triage Notes
                            </label>
                            <textarea
                                value={data.triage_notes}
                                onChange={(e) => setData('triage_notes', e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Any observations or concerns..."
                            />
                            {errors.triage_notes && (
                                <p className="text-red-600 text-sm mt-1">{errors.triage_notes}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={processing}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Skip Triage
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Complete Triage'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </HMSLayout>
    );
}
