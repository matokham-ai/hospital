import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { ArrowRightLeft } from 'lucide-react';

export default function Transfers({ transfers, stats }: any) {
    return (
        <HMSLayout>
            <Head title="Patient Transfers" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Patient Transfers</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <ArrowRightLeft className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Patient transfer management coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Track inter-ward and inter-facility transfers</p>
                </div>
            </div>
        </HMSLayout>
    );
}
