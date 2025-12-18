import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Pill } from 'lucide-react';

export default function OPDPrescriptions() {
    return (
        <HMSLayout>
            <Head title="OPD Prescriptions" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">OPD Prescriptions</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">OPD prescription management coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">View and manage outpatient prescriptions</p>
                </div>
            </div>
        </HMSLayout>
    );
}
