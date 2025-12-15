import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

export default function Notifications() {
    return (
        <HMSLayout>
            <Head title="Notification Settings" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Notification Settings</h1>
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Critical Alerts</p>
                                <p className="text-sm text-gray-600">Receive notifications for critical patient alerts</p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Medication Reminders</p>
                                <p className="text-sm text-gray-600">Get reminded about upcoming medication administrations</p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Task Notifications</p>
                                <p className="text-sm text-gray-600">Notifications for new and overdue tasks</p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
