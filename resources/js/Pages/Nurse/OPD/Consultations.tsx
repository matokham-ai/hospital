import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Stethoscope } from 'lucide-react';

export default function Consultations() {
    return (
        <HMSLayout>
            <Head title="OPD Consultations" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">OPD Consultations</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">OPD consultation management coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Track patient consultations and follow-ups</p>
                </div>
            </div>
        </HMSLayout>
    );
}
