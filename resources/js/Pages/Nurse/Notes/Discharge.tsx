import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

export default function Discharge() {
    const { data, setData, post } = useForm({
        patient_id: '',
        note_type: 'discharge',
        content: '',
    });

    return (
        <HMSLayout>
            <Head title="Discharge Notes" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Discharge Notes</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={(e) => { e.preventDefault(); post('/nurse/notes/store'); }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Patient ID</label>
                            <input type="number" value={data.patient_id} onChange={e => setData('patient_id', e.target.value)} className="w-full border rounded-lg p-3" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Discharge Summary</label>
                            <textarea value={data.content} onChange={e => setData('content', e.target.value)} rows={8} className="w-full border rounded-lg p-3 font-mono" placeholder="Discharge condition, instructions, medications, follow-up..." required />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Discharge Note</button>
                    </form>
                </div>
            </div>
        </HMSLayout>
    );
}
