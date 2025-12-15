import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { TestTube } from 'lucide-react';

export default function OPDOrders() {
    return (
        <HMSLayout>
            <Head title="OPD Labs & Imaging" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">OPD Labs & Imaging Orders</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">OPD lab and imaging orders coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Track outpatient diagnostic orders</p>
                </div>
            </div>
        </HMSLayout>
    );
}
