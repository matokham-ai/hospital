import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Prescription {
    id: number;
    patient_id: string;
    physician_id: string;
    status: string;
    created_at: string;
    patient?: {
        first_name: string;
        last_name: string;
    };
    physician?: {
        name: string;
    };
}

export default function Prescriptions({
    prescriptions,
    auth
}: {
    prescriptions: { data: Prescription[]; links: any; meta: any };
    auth: any;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter prescriptions based on search term and status
    const filteredPrescriptions = prescriptions.data?.filter(prescription => {
        const patientName = prescription.patient 
            ? `${prescription.patient.first_name} ${prescription.patient.last_name}`.toLowerCase()
            : prescription.patient_id.toLowerCase();
        const physicianName = prescription.physician?.name?.toLowerCase() || prescription.physician_id.toLowerCase();
        const prescriptionId = prescription.id.toString();
        
        const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                             physicianName.includes(searchTerm.toLowerCase()) ||
                             prescriptionId.includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    }) || [];

    return (
        <HMSLayout user={auth.user}>
            <Head title="Prescriptions - Pharmacy" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
                                    <p className="text-gray-600">Manage and dispense prescriptions</p>
                                </div>
                                <div className="flex gap-3">
                                    <Link 
                                        href="/pharmacy/dashboard"
                                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        ← Back to Dashboard
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-lg">🔍</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by patient name, prescription ID, or physician..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <span className="text-gray-400 hover:text-gray-600">✕</span>
                                        </button>
                                    )}
                                </div>
                                <div className="sm:w-48">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="verified">Verified</option>
                                        <option value="dispensed">Dispensed</option>
                                    </select>
                                </div>
                            </div>
                            {(searchTerm || statusFilter !== 'all') && (
                                <div className="mt-3 text-sm text-gray-600">
                                    Showing {filteredPrescriptions.length} of {prescriptions.data?.length || 0} prescriptions
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {filteredPrescriptions && filteredPrescriptions.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredPrescriptions.map((prescription) => (
                                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">
                                                                Prescription #{prescription.id}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                Patient: {prescription.patient ? 
                                                                    `${prescription.patient.first_name} ${prescription.patient.last_name}` : 
                                                                    `ID: ${prescription.patient_id}`
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Prescribed by: {prescription.physician?.name || `ID: ${prescription.physician_id}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Date: {new Date(prescription.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        prescription.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                        prescription.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {prescription.status}
                                                    </div>
                                                    <Link 
                                                        href={`/pharmacy/prescriptions/${prescription.id}`}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📋</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {searchTerm || statusFilter !== 'all' ? 'No prescriptions match your criteria' : 'No prescriptions found'}
                                    </h3>
                                    <p className="text-gray-600">
                                        {searchTerm || statusFilter !== 'all' 
                                            ? 'Try adjusting your search or filter criteria.' 
                                            : 'There are no prescriptions to display at the moment.'
                                        }
                                    </p>
                                    {(searchTerm || statusFilter !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setStatusFilter('all');
                                            }}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
