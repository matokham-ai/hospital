import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { CheckSquare } from 'lucide-react';

export default function TaskAssignments() {
    return (
        <HMSLayout>
            <Head title="Task Assignments" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Task Assignments</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Task assignment system coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Assign and track tasks between nurses</p>
                </div>
            </div>
        </HMSLayout>
    );
}
