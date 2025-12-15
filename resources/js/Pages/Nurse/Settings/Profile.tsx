import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

export default function Profile({ user }: any) {
    const { data, setData, put } = useForm<{
        name: string;
        email: string;
        phone: string;
    }>({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    return (
        <HMSLayout>
            <Head title="Profile Settings" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <form onSubmit={(e) => { e.preventDefault(); put('/nurse/settings/profile'); }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full border rounded-lg p-3" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full border rounded-lg p-3" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Phone</label>
                            <input type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} className="w-full border rounded-lg p-3" />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Profile</button>
                    </form>
                </div>
            </div>
        </HMSLayout>
    );
}
