import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Bell } from 'lucide-react';

export default function Notifications() {
    return (
        <HMSLayout>
            <Head title="Notifications" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Notifications</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No new notifications</p>
                </div>
            </div>
        </HMSLayout>
    );
}
