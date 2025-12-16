import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Drug {
    id: number;
    generic_name: string;
    brand_name?: string;
    strength?: string;
    formulation?: string;
}

interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
}

interface GrnItem {
    drug_id: string;
    ordered_qty: string;
    received_qty: string;
    batch_no: string;
    expiry_date: string;
    unit_price: string;
    remarks: string;
}

export default function CreateGRN({
    suppliers,
    drugs,
    grnNumber,
    auth
}: {
    suppliers: Supplier[];
    drugs: Drug[];
    grnNumber: string;
    auth: any;
}) {
    const [items, setItems] = useState<GrnItem[]>([
        {
            drug_id: '',
            ordered_qty: '',
            received_qty: '',
            batch_no: '',
            expiry_date: '',
            unit_price: '',
            remarks: ''
        }
    ]);

    const { data, setData, post, processing, errors } = useForm({
        grn_no: grnNumber,
        purchase_order_no: '',
        supplier_id: '',
        invoice_no: '',
        received_date: new Date().toISOString().split('T')[0],
        received_by: auth.user.name,
        comments: '',
        status: 'draft',
        total_amount: 0,
        items: [] as any[]
    });

    const addItem = () => {
        setItems([...items, {
            drug_id: '',
            ordered_qty: '',
            received_qty: '',
            batch_no: '',
            expiry_date: '',
            unit_price: '',
            remarks: ''
        }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof GrnItem, value: string) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        setItems(updatedItems);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            const qty = parseFloat(item.received_qty) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return total + (qty * price);
        }, 0);
    };

    const getDiscrepancyFlag = (ordered: string, received: string) => {
        const orderedQty = parseFloat(ordered) || 0;
        const receivedQty = parseFloat(received) || 0;
        
        if (orderedQty === 0) return null;
        if (receivedQty < orderedQty) return 'short';
        if (receivedQty > orderedQty) return 'excess';
        return 'ok';
    };

    const getExpiryWarning = (expiryDate: string) => {
        if (!expiryDate) return null;
        
        const expiry = new Date(expiryDate);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        
        if (expiry < new Date()) return 'expired';
        if (expiry < sixMonthsFromNow) return 'short-expiry';
        return 'ok';
    };

    const handleSubmit = (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();
        
        const formattedItems = items
            .filter(item => item.drug_id && item.received_qty)
            .map(item => ({
                drug_id: parseInt(item.drug_id),
                quantity: parseInt(item.received_qty),
                unit_price: parseFloat(item.unit_price) || 0,
                batch_no: item.batch_no || null,
                expiry_date: item.expiry_date || null,
                remarks: item.remarks || null
            }));

        // Update form data with additional fields
        setData({
            ...data,
            status: isDraft ? 'draft' : 'posted',
            items: formattedItems,
            total_amount: calculateTotal()
        });

        post('/pharmacy/grn');
    };

    const selectedSupplier = suppliers.find(s => s.id === parseInt(data.supplier_id));

    return (
        <HMSLayout user={auth.user}>
            <Head title="Create GRN - Pharmacy" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Create Goods Received Note</h1>
                                <p className="text-gray-600">Record details of goods received from suppliers</p>
                            </div>
                            <div className="flex gap-3">
                                <Link 
                                    href="/pharmacy/grn"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    ← Back to GRN List
                                </Link>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e, false)}>
                        {/* Header Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">GRN Header Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">GRN Number</label>
                                    <input
                                        type="text"
                                        value={data.grn_no}
                                        readOnly
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Order No.</label>
                                    <input
                                        type="text"
                                        value={data.purchase_order_no}
                                        onChange={(e) => setData('purchase_order_no', e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional - PO reference"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
                                    <select
                                        value={data.supplier_id}
                                        onChange={(e) => setData('supplier_id', e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.supplier_id && <p className="text-red-500 text-sm mt-1">{errors.supplier_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number *</label>
                                    <input
                                        type="text"
                                        value={data.invoice_no}
                                        onChange={(e) => setData('invoice_no', e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Supplier's invoice number"
                                        required
                                    />
                                    {errors.invoice_no && <p className="text-red-500 text-sm mt-1">{errors.invoice_no}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Received Date *</label>
                                    <input
                                        type="date"
                                        value={data.received_date}
                                        onChange={(e) => setData('received_date', e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
                                    <input
                                        type="text"
                                        value={data.received_by}
                                        onChange={(e) => setData('received_by', e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Supplier Info Display */}
                            {selectedSupplier && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-medium text-blue-900">Supplier Information</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p><strong>Contact Person:</strong> {selectedSupplier.contact_person || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {selectedSupplier.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Items Received</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                    + Add Item
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ordered Qty</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received Qty *</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch No.</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {items.map((item, index) => {
                                            const discrepancy = getDiscrepancyFlag(item.ordered_qty, item.received_qty);
                                            const expiryWarning = getExpiryWarning(item.expiry_date);
                                            const lineTotal = (parseFloat(item.received_qty) || 0) * (parseFloat(item.unit_price) || 0);
                                            
                                            return (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={item.drug_id}
                                                            onChange={(e) => updateItem(index, 'drug_id', e.target.value)}
                                                            className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        >
                                                            <option value="">Select Drug</option>
                                                            {drugs.map((drug) => (
                                                                <option key={drug.id} value={drug.id}>
                                                                    {drug.generic_name} {drug.brand_name && `(${drug.brand_name})`} - {drug.strength} {drug.formulation}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.ordered_qty}
                                                            onChange={(e) => updateItem(index, 'ordered_qty', e.target.value)}
                                                            className="block w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={item.received_qty}
                                                                onChange={(e) => updateItem(index, 'received_qty', e.target.value)}
                                                                className={`block w-20 px-2 py-1 border rounded text-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                                    discrepancy === 'short' ? 'border-red-300 bg-red-50' :
                                                                    discrepancy === 'excess' ? 'border-yellow-300 bg-yellow-50' :
                                                                    'border-gray-300'
                                                                }`}
                                                                min="0"
                                                                required
                                                            />
                                                            {discrepancy === 'short' && <span className="text-red-500 text-xs">Short</span>}
                                                            {discrepancy === 'excess' && <span className="text-yellow-600 text-xs">Excess</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.batch_no}
                                                            onChange={(e) => updateItem(index, 'batch_no', e.target.value)}
                                                            className="block w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Batch"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="relative">
                                                            <input
                                                                type="date"
                                                                value={item.expiry_date}
                                                                onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                                                                className={`block w-32 px-2 py-1 border rounded text-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                                    expiryWarning === 'expired' ? 'border-red-300 bg-red-50' :
                                                                    expiryWarning === 'short-expiry' ? 'border-orange-300 bg-orange-50' :
                                                                    'border-gray-300'
                                                                }`}
                                                            />
                                                            {expiryWarning === 'expired' && <span className="text-red-500 text-xs">Expired!</span>}
                                                            {expiryWarning === 'short-expiry' && <span className="text-orange-600 text-xs">&lt;6 months</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                            className="block w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-sm font-medium">
                                                        ${lineTotal.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.remarks}
                                                            onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                                                            className="block w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Notes"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                className="text-red-600 hover:text-red-900 text-sm"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                                    <textarea
                                        value={data.comments}
                                        onChange={(e) => setData('comments', e.target.value)}
                                        rows={4}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional notes about this GRN..."
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Total Items:</span>
                                                <span>{items.filter(item => item.drug_id && item.received_qty).length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Quantity:</span>
                                                <span>{items.reduce((sum, item) => sum + (parseFloat(item.received_qty) || 0), 0)}</span>
                                            </div>
                                            <div className="flex justify-between font-medium text-lg border-t pt-2">
                                                <span>Total Value:</span>
                                                <span>${calculateTotal().toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => handleSubmit(e, true)}
                                            disabled={processing}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Save Draft
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {processing ? 'Submitting...' : 'Submit GRN'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </HMSLayout>
    );
}
