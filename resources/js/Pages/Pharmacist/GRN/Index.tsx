import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface GrnItem {
    id: number;
    drug_id: number;
    quantity: number;
    unit_price: number;
    batch_no?: string;
    expiry_date?: string;
    drug?: {
        generic_name: string;
        brand_name?: string;
        strength?: string;
        formulation?: string;
    };
}

interface Grn {
    id: number;
    invoice_no: string;
    received_date: string;
    total_amount: number;
    status: string;
    created_at: string;
    supplier?: {
        id: number;
        name: string;
    };
    items?: GrnItem[];
}

export default function GRNIndex({
    grns,
    auth
}: {
    grns: { data: Grn[]; links: any; meta: any };
    auth: any;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredGrns = grns.data?.filter(grn => {
        const matchesSearch = grn.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             grn.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
        
        const matchesStatus = statusFilter === 'all' || grn.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    }) || [];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'posted':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="GRN Management - Pharmacy" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Goods Received Notes (GRN)</h1>
                                <p className="text-gray-600">Manage incoming stock from suppliers</p>
                            </div>
                            <div className="flex gap-3">
                                <Link 
                                    href="/pharmacy/grn/create"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    + Create New GRN
                                </Link>
                                <Link 
                                    href="/pharmacy/inventory"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    ← Back to Inventory
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-lg">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by invoice number or supplier name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                            <div className="sm:w-48">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="posted">Posted</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total GRNs</p>
                                    <p className="text-2xl font-bold text-blue-600">{grns.meta?.total || 0}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <span className="text-2xl">📦</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Posted</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {grns.data?.filter(g => g.status === 'posted').length || 0}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50">
                                    <span className="text-2xl">✅</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Draft</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {grns.data?.filter(g => g.status === 'draft').length || 0}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-yellow-50">
                                    <span className="text-2xl">📝</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        KES {grns.data?.reduce((sum, grn) => sum + (grn.total_amount || 0), 0).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-50">
                                    <span className="text-2xl">💰</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GRN Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Recent GRNs</h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {filteredGrns && filteredGrns.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GRN Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredGrns.map((grn) => (
                                            <tr key={grn.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Invoice: {grn.invoice_no}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Received: {new Date(grn.received_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Created: {new Date(grn.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {grn.supplier?.name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {grn.items?.length || 0} items
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        KES {grn.total_amount?.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(grn.status)}`}>
                                                        {grn.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        href={`/pharmacy/grn/${grn.id}`}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    >
                                                        View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📦</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No GRNs found</h3>
                                    <p className="text-gray-600 mb-4">
                                        {searchTerm || statusFilter !== 'all' 
                                            ? 'Try adjusting your search or filter criteria.' 
                                            : 'Start by creating your first GRN to record received goods.'
                                        }
                                    </p>
                                    <Link
                                        href="/pharmacy/grn/create"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Create First GRN
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
