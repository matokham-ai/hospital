import { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { PageProps } from '@/types';

interface Incident {
    id: number;
    patient_name?: string;
    incident_type: string;
    severity: string;
    description: string;
    reported_at: string;
    reported_by: string;
    status: string;
}

interface Props extends PageProps {
    recent_incidents: Incident[];
    patients: Array<{ id: number; name: string; mrn: string }>;
}

export default function IncidentReport({ auth, recent_incidents = [], patients = [] }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        patient_id: '',
        incident_type: 'fall',
        severity: 'minor',
        location: '',
        description: '',
        immediate_action: '',
        witnesses: '',
        occurred_at: new Date().toISOString().slice(0, 16),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/nurse/documentation/incident', {
            onSuccess: () => reset(),
        });
    };

    const incidentTypes = [
        { value: 'fall', label: 'Patient Fall' },
        { value: 'medication_error', label: 'Medication Error' },
        { value: 'pressure_injury', label: 'Pressure Injury' },
        { value: 'equipment_failure', label: 'Equipment Failure' },
        { value: 'infection', label: 'Healthcare-Associated Infection' },
        { value: 'adverse_reaction', label: 'Adverse Drug Reaction' },
        { value: 'patient_injury', label: 'Patient Injury' },
        { value: 'security', label: 'Security Incident' },
        { value: 'other', label: 'Other' },
    ];

    const severityLevels = [
        { value: 'minor', label: 'Minor - No harm', color: 'text-green-800 bg-green-100' },
        { value: 'moderate', label: 'Moderate - Temporary harm', color: 'text-yellow-800 bg-yellow-100' },
        { value: 'major', label: 'Major - Permanent harm', color: 'text-orange-800 bg-orange-100' },
        { value: 'critical', label: 'Critical - Life-threatening', color: 'text-red-800 bg-red-100' },
    ];

    return (
        <HMSLayout user={auth.user}>
            <Head title="Incident Report" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Safety Incident Reporting</h1>
                        <p className="mt-1 text-sm text-gray-600">Document safety events and adverse incidents</p>
                    </div>

                    {/* Alert Banner */}
                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Important: Report all safety incidents immediately
                                </h3>
                                <p className="mt-1 text-sm text-yellow-700">
                                    For critical incidents, notify the charge nurse and physician immediately before completing this form.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Report Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">New Incident Report</h2>
                                </div>
                                <form onSubmit={submit} className="p-6 space-y-6">
                                    {/* Patient Selection */}
                                    <div>
                                        <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700">
                                            Patient (if applicable)
                                        </label>
                                        <select
                                            id="patient_id"
                                            value={data.patient_id}
                                            onChange={(e) => setData('patient_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Not patient-related</option>
                                            {patients.map((patient) => (
                                                <option key={patient.id} value={patient.id}>
                                                    {patient.name} (MRN: {patient.mrn})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {/* Incident Type */}
                                        <div>
                                            <label htmlFor="incident_type" className="block text-sm font-medium text-gray-700">
                                                Incident Type *
                                            </label>
                                            <select
                                                id="incident_type"
                                                value={data.incident_type}
                                                onChange={(e) => setData('incident_type', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                required
                                            >
                                                {incidentTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Severity */}
                                        <div>
                                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                                                Severity *
                                            </label>
                                            <select
                                                id="severity"
                                                value={data.severity}
                                                onChange={(e) => setData('severity', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                required
                                            >
                                                {severityLevels.map((level) => (
                                                    <option key={level.value} value={level.value}>
                                                        {level.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {/* Location */}
                                        <div>
                                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                                Location *
                                            </label>
                                            <input
                                                type="text"
                                                id="location"
                                                value={data.location}
                                                onChange={(e) => setData('location', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="e.g., Ward 3, Room 205"
                                                required
                                            />
                                        </div>

                                        {/* Occurred At */}
                                        <div>
                                            <label htmlFor="occurred_at" className="block text-sm font-medium text-gray-700">
                                                Occurred At *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                id="occurred_at"
                                                value={data.occurred_at}
                                                onChange={(e) => setData('occurred_at', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Incident Description *
                                        </label>
                                        <textarea
                                            id="description"
                                            rows={4}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Describe what happened in detail..."
                                            required
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Immediate Action */}
                                    <div>
                                        <label htmlFor="immediate_action" className="block text-sm font-medium text-gray-700">
                                            Immediate Action Taken *
                                        </label>
                                        <textarea
                                            id="immediate_action"
                                            rows={3}
                                            value={data.immediate_action}
                                            onChange={(e) => setData('immediate_action', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="What actions were taken immediately after the incident?"
                                            required
                                        />
                                    </div>

                                    {/* Witnesses */}
                                    <div>
                                        <label htmlFor="witnesses" className="block text-sm font-medium text-gray-700">
                                            Witnesses
                                        </label>
                                        <input
                                            type="text"
                                            id="witnesses"
                                            value={data.witnesses}
                                            onChange={(e) => setData('witnesses', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Names of witnesses, if any"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => reset()}
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Clear Form
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {processing ? 'Submitting...' : 'Submit Report'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Recent Incidents Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Recent Incidents</h2>
                                </div>
                                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                    {recent_incidents.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 text-sm">
                                            No recent incidents
                                        </div>
                                    ) : (
                                        recent_incidents.map((incident) => (
                                            <div key={incident.id} className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {incident.incident_type.replace('_', ' ').toUpperCase()}
                                                        </p>
                                                        {incident.patient_name && (
                                                            <p className="text-xs text-gray-500">{incident.patient_name}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        severityLevels.find(l => l.value === incident.severity)?.color || 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {incident.severity}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                                    {incident.description}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {new Date(incident.reported_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
