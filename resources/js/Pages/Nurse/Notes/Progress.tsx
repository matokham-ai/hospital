import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

export default function Progress({ notes }: any) {
    const { data, setData, post } = useForm({
        patient_id: '',
        note_type: 'progress',
        content: '',
    });

    const submitNote = (e: React.FormEvent) => {
        e.preventDefault();
        post('/nurse/notes/store');
    };

    return (
        <HMSLayout>
            <Head title="Progress Notes" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Progress Notes</h1>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={submitNote} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Patient ID</label>
                            <input
                                type="number"
                                value={data.patient_id}
                                onChange={e => setData('patient_id', e.target.value)}
                                className="w-full border rounded-lg p-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Progress Note</label>
                            <textarea
                                value={data.content}
                                onChange={e => setData('content', e.target.value)}
                                rows={8}
                                className="w-full border rounded-lg p-3 font-mono"
                                placeholder="S: Subjective&#10;O: Objective&#10;A: Assessment&#10;P: Plan"
                                required
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save Note
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Notes</h2>
                    <div className="space-y-4">
                        {notes.map((note: any) => (
                            <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                <p className="font-semibold">{note.patient_name}</p>
                                <p className="text-sm text-gray-600">{note.content}</p>
                                <p className="text-xs text-gray-500 mt-1">{note.created_by} • {new Date(note.created_at).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
