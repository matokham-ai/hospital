import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Syringe } from 'lucide-react';

export default function OPDProcedures() {
    return (
        <HMSLayout>
            <Head title="OPD Procedures" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">OPD Procedures</h1>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Syringe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">OPD procedure tracking coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Minor procedures and treatments in OPD</p>
                </div>
            </div>
        </HMSLayout>
    );
}
