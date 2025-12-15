import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { TrendingUp } from 'lucide-react';

export default function Trends() {
    return (
        <HMSLayout>
            <Head title="Trend Charts" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Trend Charts</h1>
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Trend charts visualization coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Will display vitals and lab trends over time</p>
                </div>
            </div>
        </HMSLayout>
    );
}
