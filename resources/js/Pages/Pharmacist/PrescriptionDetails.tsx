import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

interface PrescriptionItem {
    id: number;
    drug_id: number;
    dose?: string;
    frequency?: string;
    duration?: string;
    quantity: number;
    instructions?: string;
    drug?: {
        generic_name: string;
        brand_name?: string;
        strength?: string;
    };
}

interface Prescription {
    id: number;
    patient_id: string;
    physician_id: string;
    status: string;
    created_at: string;
    notes?: string;
    patient?: {
        first_name: string;
        last_name: string;
    };
    physician?: {
        name: string;
    };
    items?: PrescriptionItem[];
}

export default function PrescriptionDetails({
    prescription,
    auth
}: {
    prescription: Prescription;
    auth: any;
}) {
    const [showDispenseModal, setShowDispenseModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PrescriptionItem | null>(null);
    const [showNotesModal, setShowNotesModal] = useState(false);

    const { data: dispenseData, setData: setDispenseData, post: postDispense, processing: dispensing } = useForm({
        quantity: '',
        batch_no: '',
    });

    const { data: notesData, setData: setNotesData, post: postNotes, processing: addingNotes } = useForm({
        notes: '',
    });

    const handleVerifyPrescription = () => {
        router.post(`/pharmacy/prescriptions/${prescription.id}/verify`, {}, {
            onSuccess: () => {
                // Refresh the page or show success message
            }
        });
    };

    const handleDispenseItem = (item: PrescriptionItem) => {
        setSelectedItem(item);
        setDispenseData('quantity', item.quantity.toString());
        setShowDispenseModal(true);
    };

    const submitDispense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        postDispense(`/pharmacy/prescriptions/${prescription.id}/dispense`, {
            onSuccess: () => {
                setShowDispenseModal(false);
                setSelectedItem(null);
                setDispenseData({ quantity: '', batch_no: '' });
            }
        });
    };

    const submitNotes = (e: React.FormEvent) => {
        e.preventDefault();
        postNotes(`/pharmacy/prescriptions/${prescription.id}/notes`, {
            onSuccess: () => {
                setShowNotesModal(false);
                setNotesData('notes', '');
            }
        });
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title={`Prescription #${prescription.id} - Pharmacy`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Prescription #{prescription.id}</h1>
                                <p className="text-gray-600">View and manage prescription details</p>
                            </div>
                            <div className="flex gap-3">
                                <Link 
                                    href="/pharmacy/prescriptions"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    ← Back to Prescriptions
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Prescription Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescription Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Information</h3>
                                <p className="text-lg font-medium text-gray-900">
                                    {prescription.patient ? 
                                        `${prescription.patient.first_name} ${prescription.patient.last_name}` : 
                                        `Patient ID: ${prescription.patient_id}`
                                    }
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Prescribing Physician</h3>
                                <p className="text-lg font-medium text-gray-900">
                                    {prescription.physician?.name || `Dr. ${prescription.physician_id || 'Unknown'}`}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Prescription Date</h3>
                                <p className="text-lg font-medium text-gray-900">
                                    {new Date(prescription.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                    prescription.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                    prescription.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {prescription.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {prescription.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pharmacist Notes</h2>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                    {prescription.notes}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Prescription Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Prescribed Medications</h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {prescription.items && prescription.items.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dose</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {prescription.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.drug?.generic_name || 'Unknown Drug'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {item.drug?.brand_name && `${item.drug.brand_name} • `}
                                                            {item.drug?.strength}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.dose || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.frequency || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.duration || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {prescription.status === 'verified' ? (
                                                        <button 
                                                            onClick={() => handleDispenseItem(item)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                        >
                                                            Dispense
                                                        </button>
                                                    ) : prescription.status === 'pending' ? (
                                                        <span className="text-gray-500 text-xs">Verify first</span>
                                                    ) : (
                                                        <span className="text-green-600 text-xs">Dispensed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No medications found</h3>
                                    <p className="text-gray-600">This prescription has no medication items.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                        <div className="flex gap-4">
                            {prescription.status === 'pending' && (
                                <button 
                                    onClick={handleVerifyPrescription}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Verify Prescription
                                </button>
                            )}
                            <button 
                                onClick={() => setShowNotesModal(true)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Add Notes
                            </button>
                            {prescription.status === 'verified' && (
                                <Link
                                    href={`/billing/prescriptions/${prescription.id}/generate`}
                                    method="post"
                                    as="button"
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Generate Bill
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Dispense Modal */}
                    {showDispenseModal && selectedItem && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Dispense Prescription</h3>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        <strong>{selectedItem.drug?.generic_name}</strong>
                                        {selectedItem.drug?.brand_name && ` (${selectedItem.drug.brand_name})`}
                                    </p>
                                    <p className="text-xs text-gray-500">Prescribed: {selectedItem.quantity} units</p>
                                    <p className="text-xs text-gray-500">This will mark the entire prescription as dispensed.</p>
                                </div>
                                
                                <form onSubmit={submitDispense} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity to Dispense
                                        </label>
                                        <input
                                            type="number"
                                            value={dispenseData.quantity}
                                            onChange={(e) => setDispenseData('quantity', e.target.value)}
                                            max={selectedItem.quantity}
                                            min="1"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Batch Number (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={dispenseData.batch_no}
                                            onChange={(e) => setDispenseData('batch_no', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={dispensing}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {dispensing ? 'Dispensing...' : 'Dispense'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDispenseModal(false)}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Notes Modal */}
                    {showNotesModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Add Notes</h3>
                                
                                <form onSubmit={submitNotes} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pharmacist Notes
                                        </label>
                                        <textarea
                                            value={notesData.notes}
                                            onChange={(e) => setNotesData('notes', e.target.value)}
                                            rows={4}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter notes about this prescription..."
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={addingNotes}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {addingNotes ? 'Adding...' : 'Add Notes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNotesModal(false)}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HMSLayout>
    );
}
