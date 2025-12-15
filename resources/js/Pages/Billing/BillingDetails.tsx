import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatKESSimple } from '@/utils/currency';

interface BillingItem {
    id: number;
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    status: string;
    created_at: string;
}

interface BillingAccount {
    id: number;
    account_no: string;
    patient_id: string;
    encounter_id: number;
    status: string;
    total_amount: number;
    amount_paid: number;
    balance: number;
    items: BillingItem[];
}

interface ServiceItem {
    id: number;
    code: string;
    name: string;
    category: string;
    unit_price: number;
    description: string;
    unit_of_measure: string;
}

export default function BillingDetails({
    billingAccount,
    serviceCatalogue = {},
    auth
}: {
    billingAccount: BillingAccount;
    serviceCatalogue?: Record<string, ServiceItem[]>;
    auth: any;
}) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAddChargeModal, setShowAddChargeModal] = useState(false);
    const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

    const { data: paymentData, setData: setPaymentData, post: postPayment, processing } = useForm({
        amount: '',
        payment_method: 'cash',
    });

    const { data: chargeData, setData: setChargeData, post: postCharge, processing: processingCharge } = useForm<{
        item_type: string;
        description: string;
        quantity: string;
        unit_price: string;
        discount_amount: string;
        service_code: string;
        reference_type: string | null;
        reference_id: number | null;
    }>({
        item_type: 'consultation',
        description: '',
        quantity: '1',
        unit_price: '',
        discount_amount: '0',
        service_code: '',
        reference_type: null,
        reference_id: null,
    });

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        postPayment(`/billing/accounts/${billingAccount.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                setPaymentData({ amount: '', payment_method: 'cash' });
            }
        });
    };

    const submitCharge = (e: React.FormEvent) => {
        e.preventDefault();
        postCharge(`/billing/encounters/${billingAccount.encounter_id}/items`, {
            onSuccess: () => {
                setShowAddChargeModal(false);
                setChargeData({
                    item_type: 'consultation',
                    description: '',
                    quantity: '1',
                    unit_price: '',
                    discount_amount: '0',
                    service_code: '',
                    reference_type: null,
                    reference_id: null,
                });
                setSelectedService(null);
            }
        });
    };

    // Handle category change
    const handleCategoryChange = (category: string) => {
        setChargeData('item_type', category);
        setSelectedService(null);
        setChargeData('description', '');
        setChargeData('unit_price', '');
        setChargeData('service_code', '');

        // Set available services for this category
        const services = serviceCatalogue?.[category] || [];
        setAvailableServices(services);
    };

    // Handle service selection
    const handleServiceSelect = (serviceId: string) => {
        const service = availableServices.find(s => s.id.toString() === serviceId);
        if (service) {
            setSelectedService(service);
            setChargeData('description', service.name);
            setChargeData('unit_price', service.unit_price.toString());
            setChargeData('service_code', service.code);
        }
    };

    // Initialize available services when modal opens
    useEffect(() => {
        if (showAddChargeModal && serviceCatalogue) {
            const services = serviceCatalogue[chargeData.item_type] || [];
            setAvailableServices(services);
        }
    }, [showAddChargeModal, chargeData.item_type, serviceCatalogue]);

    const getItemTypeColor = (type: string) => {
        const colors = {
            pharmacy: 'bg-green-100 text-green-800',
            consultation: 'bg-blue-100 text-blue-800',
            lab_test: 'bg-purple-100 text-purple-800',
            procedure: 'bg-orange-100 text-orange-800',
            bed_charge: 'bg-gray-100 text-gray-800',
            other: 'bg-yellow-100 text-yellow-800',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title={`Billing - Account ${billingAccount.account_no}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Billing Account: {billingAccount.account_no}</h1>
                                <p className="text-gray-600">Patient ID: {billingAccount.patient_id} • Encounter: {billingAccount.encounter_id}</p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/pharmacy/dashboard"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    ← Back to Pharmacy
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Billing Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatKESSimple(billingAccount.total_amount)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <span className="text-2xl">💰</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                                    <p className="text-2xl font-bold text-green-600">{formatKESSimple(billingAccount.amount_paid)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50">
                                    <span className="text-2xl">✅</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Balance Due</p>
                                    <p className={`text-2xl font-bold ${billingAccount.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatKESSimple(billingAccount.balance)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-50">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Status</p>
                                    <p className={`text-lg font-bold ${billingAccount.status === 'closed' ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                        {billingAccount.status.toUpperCase()}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50">
                                    <span className="text-2xl">📊</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Billing Items</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddChargeModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Charge
                                </button>
                                {billingAccount.balance > 0 && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Process Payment
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {billingAccount.items && billingAccount.items.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {billingAccount.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getItemTypeColor(item.item_type)}`}>
                                                        {item.item_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatKESSimple(item.unit_price)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatKESSimple(item.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💰</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No billing items found</h3>
                                    <p className="text-gray-600">No items have been added to this billing account yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Modal */}
                    {showPaymentModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Process Payment</h3>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        <strong>Balance Due: {formatKESSimple(billingAccount.balance)}</strong>
                                    </p>
                                </div>

                                <form onSubmit={submitPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Amount
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData('amount', e.target.value)}
                                            max={billingAccount.balance}
                                            min="0.01"
                                            required
                                            placeholder="Enter amount in KES"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentData.payment_method}
                                            onChange={(e) => setPaymentData('payment_method', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="cash">Cash (KES)</option>
                                            <option value="mpesa">M-Pesa</option>
                                            <option value="card">Credit/Debit Card</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="insurance">Insurance (NHIF/Private)</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {processing ? 'Processing...' : 'Process Payment'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentModal(false)}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Add Charge Modal */}
                    {showAddChargeModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                                <h3 className="text-lg font-semibold mb-4">Add New Charge</h3>

                                <form onSubmit={submitCharge} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Item Type
                                            </label>
                                            <select
                                                value={chargeData.item_type}
                                                onChange={(e) => handleCategoryChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="consultation">Consultation</option>
                                                <option value="lab_test">Lab Test</option>
                                                <option value="imaging">Imaging</option>
                                                <option value="procedure">Procedure</option>
                                                <option value="medication">Medication</option>
                                                <option value="consumable">Consumable</option>
                                                <option value="bed_charge">Bed Charge</option>
                                                <option value="nursing">Nursing</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Service
                                            </label>
                                            <select
                                                value={selectedService?.id || ''}
                                                onChange={(e) => handleServiceSelect(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                disabled={availableServices.length === 0}
                                            >
                                                <option value="">Select a service...</option>
                                                {availableServices.map((service) => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.name} - {formatKESSimple(service.unit_price)}
                                                    </option>
                                                ))}
                                            </select>
                                            {availableServices.length === 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    No services available for this category
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedService && (
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="text-sm">
                                                <div className="font-medium text-blue-900">Selected Service</div>
                                                <div className="text-blue-700">
                                                    <strong>Code:</strong> {selectedService.code}
                                                </div>
                                                <div className="text-blue-700">
                                                    <strong>Description:</strong> {selectedService.description || selectedService.name}
                                                </div>
                                                <div className="text-blue-700">
                                                    <strong>Unit Price:</strong> {formatKESSimple(selectedService.unit_price)}
                                                    {selectedService.unit_of_measure && ` per ${selectedService.unit_of_measure}`}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={chargeData.description}
                                            onChange={(e) => setChargeData('description', e.target.value)}
                                            required
                                            placeholder={selectedService ? "Auto-filled from service" : "Enter service description"}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={chargeData.quantity}
                                                onChange={(e) => setChargeData('quantity', e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Unit Price (KES)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={chargeData.unit_price}
                                                onChange={(e) => setChargeData('unit_price', e.target.value)}
                                                required
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Discount (KES)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={chargeData.discount_amount}
                                                onChange={(e) => setChargeData('discount_amount', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {chargeData.unit_price && chargeData.quantity && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="text-sm text-gray-600">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>{formatKESSimple(parseFloat(chargeData.unit_price) * parseInt(chargeData.quantity))}</span>
                                                </div>
                                                {chargeData.discount_amount && parseFloat(chargeData.discount_amount) > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Discount:</span>
                                                        <span>-{formatKESSimple(parseFloat(chargeData.discount_amount))}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-semibold text-gray-900 border-t pt-2 mt-2">
                                                    <span>Net Amount:</span>
                                                    <span>{formatKESSimple(
                                                        (parseFloat(chargeData.unit_price) * parseInt(chargeData.quantity)) -
                                                        (parseFloat(chargeData.discount_amount) || 0)
                                                    )}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={processingCharge}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {processingCharge ? 'Adding...' : 'Add Charge'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddChargeModal(false)}
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