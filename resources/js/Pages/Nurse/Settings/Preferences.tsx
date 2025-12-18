import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

export default function Preferences() {
    const { data, setData, put } = useForm({
        theme: 'light',
        language: 'en',
        default_view: 'dashboard',
    });

    return (
        <HMSLayout>
            <Head title="Preferences" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Preferences</h1>
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <form onSubmit={(e) => { e.preventDefault(); put('/nurse/settings/preferences'); }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Theme</label>
                            <select value={data.theme} onChange={e => setData('theme', e.target.value)} className="w-full border rounded-lg p-3">
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Language</label>
                            <select value={data.language} onChange={e => setData('language', e.target.value)} className="w-full border rounded-lg p-3">
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Default View</label>
                            <select value={data.default_view} onChange={e => setData('default_view', e.target.value)} className="w-full border rounded-lg p-3">
                                <option value="dashboard">Dashboard</option>
                                <option value="patients">My Patients</option>
                                <option value="tasks">Tasks</option>
                            </select>
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Preferences</button>
                    </form>
                </div>
            </div>
        </HMSLayout>
    );
}
