import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

export default function RunningBill({ encounter, billingAccount, billingItems, summary }) {
    const [showAddItem, setShowAddItem] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        item_type: 'consumable',
        description: '',
        quantity: 1,
        unit_price: 0,
        service_id: null,
    });

    const paymentForm = useForm({
        amount: '',
        method: 'cash',
        reference_no: '',
        notes: '',
    });

    const handleAddItem = (e) => {
        e.preventDefault();
        post(route('inpatient.billing.add-item', encounter.id), {
            onSuccess: () => {
                setShowAddItem(false);
                setData({
                    item_type: 'consumable',
                    description: '',
                    quantity: 1,
                    unit_price: 0,
                    service_id: null,
                });
            }
        });
    };

    const handlePayment = (e) => {
        e.preventDefault();
        paymentForm.post(route('inpatient.billing.process-payment', billingAccount.id), {
            onSuccess: () => {
                setShowPayment(false);
                paymentForm.reset();
            }
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    return (
        <HMSLayout>
            <Head title={`Billing - ${encounter.patient.first_name} ${encounter.patient.last_name}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Patient Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Running Bill - {encounter.patient.first_name} {encounter.patient.last_name}
                                    </h1>
                                    <p className="text-gray-600">
                                        Encounter: {encounter.encounter_number} | 
                                        Department: {encounter.department?.name}
                                    </p>
                                    {billingAccount && (
                                        <p className="text-sm text-gray-500">
                                            Account: {billingAccount.account_no} | 
                                            Status: <span className="capitalize">{billingAccount.status}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {formatCurrency(summary.balance)}
                                    </div>
                                    <div className="text-sm text-gray-500">Outstanding Balance</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Billing Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Billing Items</h2>
                                        <button
                                            onClick={() => setShowAddItem(true)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Add Item
                                        </button>
                                    </div>

                                    {Object.keys(billingItems).length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No billing items yet</p>
                                    ) : (
                                        Object.entries(billingItems).map(([itemType, items]) => (
                                            <div key={itemType} className="mb-6">
                                                <h3 className="text-md font-medium text-gray-700 mb-2 capitalize">
                                                    {itemType.replace('_', ' ')}
                                                </h3>
                                                <div className="space-y-2">
                                                    {items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                            <div>
                                                                <div className="font-medium">{item.description}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                                                    {item.discount_amount > 0 && (
                                                                        <span className="text-green-600 ml-2">
                                                                            (Discount: {formatCurrency(item.discount_amount)})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-semibold">
                                                                    {formatCurrency(item.net_amount)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 capitalize">
                                                                    {item.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary & Payment */}
                        <div className="space-y-6">
                            {/* Bill Summary */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Bill Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Total Amount:</span>
                                            <span>{formatCurrency(summary.total_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Discount:</span>
                                            <span className="text-green-600">-{formatCurrency(summary.discount_amount)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span>Net Amount:</span>
                                            <span>{formatCurrency(summary.net_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Amount Paid:</span>
                                            <span className="text-green-600">{formatCurrency(summary.amount_paid)}</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Balance:</span>
                                            <span className="text-red-600">{formatCurrency(summary.balance)}</span>
                                        </div>
                                    </div>

                                    {summary.balance > 0 && (
                                        <button
                                            onClick={() => setShowPayment(true)}
                                            className="w-full mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Process Payment
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Item Modal */}
                    {showAddItem && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Billing Item</h3>
                                <form onSubmit={handleAddItem}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Item Type
                                        </label>
                                        <select
                                            value={data.item_type}
                                            onChange={(e) => setData('item_type', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="consumable">Consumable</option>
                                            <option value="procedure">Procedure</option>
                                            <option value="medication">Medication</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                Unit Price
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.unit_price}
                                                onChange={(e) => setData('unit_price', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddItem(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            Add Item
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Payment Modal */}
                    {showPayment && billingAccount && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Process Payment</h3>
                                <form onSubmit={handlePayment}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Amount (Max: {formatCurrency(summary.balance)})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            max={summary.balance}
                                            value={paymentForm.data.amount}
                                            onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentForm.data.method}
                                            onChange={(e) => paymentForm.setData('method', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="mobile_money">Mobile Money</option>
                                            <option value="insurance">Insurance</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Reference Number
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentForm.data.reference_no}
                                            onChange={(e) => paymentForm.setData('reference_no', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPayment(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={paymentForm.processing}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                        >
                                            Process Payment
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