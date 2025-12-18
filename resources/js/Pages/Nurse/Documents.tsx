import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { FolderOpen } from 'lucide-react';

export default function Documents() {
    return (
        <HMSLayout>
            <Head title="Patient Documents" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Patient Documents</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Patient document management coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Upload and manage patient files and documents</p>
                </div>
            </div>
        </HMSLayout>
    );
}
