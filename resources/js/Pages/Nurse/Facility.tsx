import React from 'react';
import { Head, Link } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Building2, Stethoscope, Bed, AlertTriangle, Heart, Users } from 'lucide-react';

export default function Facility() {
    const facilities = [
        { name: 'OPD', icon: Stethoscope, href: '/nurse/facility/opd', color: 'blue' },
        { name: 'IPD', icon: Bed, href: '/nurse/facility/ipd', color: 'green' },
        { name: 'Emergency', icon: AlertTriangle, href: '/nurse/facility/emergency', color: 'red' },
        { name: 'ICU', icon: Heart, href: '/nurse/facility/icu', color: 'purple' },
        { name: 'Maternity', icon: Users, href: '/nurse/facility/maternity', color: 'pink' },
    ];

    return (
        <HMSLayout>
            <Head title="Facility Switcher" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Select Facility</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {facilities.map((facility) => (
                        <Link
                            key={facility.name}
                            href={facility.href}
                            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow text-center"
                        >
                            <facility.icon className={`h-16 w-16 text-${facility.color}-500 mx-auto mb-4`} />
                            <h2 className="text-xl font-bold">{facility.name}</h2>
                        </Link>
                    ))}
                </div>
            </div>
        </HMSLayout>
    );
}
