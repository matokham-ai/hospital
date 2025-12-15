import { useState, FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { PageProps } from '@/types';

interface Note {
    id: number;
    patient_name: string;
    patient_mrn: string;
    note_type: string;
    content: string;
    created_at: string;
    created_by: string;
}

interface Props extends PageProps {
    recent_notes: Note[];
    patients: Array<{ id: number; name: string; mrn: string }>;
}

export default function NursingNotes({ auth, recent_notes = [], patients = [] }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        patient_id: '',
        note_type: 'progress',
        content: '',
    });

    const noteTemplates = {
        progress: 'Patient assessment:\n\nSubjective:\n\nObjective:\n\nAssessment:\n\nPlan:',
        shift: 'Shift handover:\n\nPatient condition:\n\nCompleted tasks:\n\nPending tasks:\n\nConcerns:',
        admission: 'Admission note:\n\nAdmission time:\nAdmission diagnosis:\nVital signs:\nAllergies:\nCurrent medications:\nInitial assessment:',
        discharge: 'Discharge note:\n\nDischarge time:\nDischarge condition:\nDischarge instructions:\nFollow-up appointments:\nMedications prescribed:',
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/nurse/documentation/note', {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const applyTemplate = (template: string) => {
        setData('content', noteTemplates[template as keyof typeof noteTemplates] || '');
        setSelectedTemplate(template);
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Nursing Notes" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Clinical Documentation</h1>
                            <p className="mt-1 text-sm text-gray-600">Create and manage nursing notes</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            {showForm ? 'Cancel' : 'New Note'}
                        </button>
                    </div>

                    {/* Note Form */}
                    {showForm && (
                        <div className="bg-white shadow rounded-lg mb-6">
                            <form onSubmit={submit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {/* Patient Selection */}
                                    <div>
                                        <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700">
                                            Patient *
                                        </label>
                                        <select
                                            id="patient_id"
                                            value={data.patient_id}
                                            onChange={(e) => setData('patient_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                        >
                                            <option value="">Select patient...</option>
                                            {patients.map((patient) => (
                                                <option key={patient.id} value={patient.id}>
                                                    {patient.name} (MRN: {patient.mrn})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.patient_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>
                                        )}
                                    </div>

                                    {/* Note Type */}
                                    <div>
                                        <label htmlFor="note_type" className="block text-sm font-medium text-gray-700">
                                            Note Type *
                                        </label>
                                        <select
                                            id="note_type"
                                            value={data.note_type}
                                            onChange={(e) => {
                                                setData('note_type', e.target.value);
                                                applyTemplate(e.target.value);
                                            }}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                        >
                                            <option value="progress">Progress Note</option>
                                            <option value="shift">Shift Note</option>
                                            <option value="admission">Admission Note</option>
                                            <option value="discharge">Discharge Note</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Template Buttons */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quick Templates
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(noteTemplates).map((template) => (
                                            <button
                                                key={template}
                                                type="button"
                                                onClick={() => applyTemplate(template)}
                                                className={`px-3 py-1 text-sm rounded-md ${
                                                    selectedTemplate === template
                                                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                        : 'bg-gray-100 text-gray-700 border-gray-300'
                                                } border hover:bg-blue-50`}
                                            >
                                                {template.charAt(0).toUpperCase() + template.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                        Note Content *
                                    </label>
                                    <textarea
                                        id="content"
                                        rows={12}
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                                        placeholder="Enter clinical documentation..."
                                        required
                                    />
                                    {errors.content && (
                                        <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Auto-save enabled. Changes are saved every 30 seconds.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            reset();
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save Note'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Recent Notes */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Recent Notes</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {recent_notes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="mt-2">No notes found</p>
                                </div>
                            ) : (
                                recent_notes.map((note) => (
                                    <div key={note.id} className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {note.patient_name} (MRN: {note.patient_mrn})
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {note.note_type.charAt(0).toUpperCase() + note.note_type.slice(1)} Note
                                                </p>
                                            </div>
                                            <div className="text-right text-sm text-gray-500">
                                                <p>{new Date(note.created_at).toLocaleString()}</p>
                                                <p>By: {note.created_by}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                                            {note.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
