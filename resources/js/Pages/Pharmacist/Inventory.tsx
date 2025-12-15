import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

interface InventoryItem {
    id: number;
    drug_id: number;
    quantity: number;
    min_level: number;
    max_level: number;
    batch_no?: string;
    expiry_date?: string;
    drug?: {
        id: number;
        generic_name: string;
        brand_name?: string;
        strength?: string;
        formulation?: string;
    };
    store?: {
        id: number;
        name: string;
    };
}

interface Drug {
    id: number;
    generic_name: string;
    brand_name?: string;
    strength?: string;
    formulation?: string;
}

interface Store {
    id: number;
    name: string;
}

export default function Inventory({
    stock,
    lowStockCount,
    nearExpiryCount,
    auth
}: {
    stock: { data: InventoryItem[]; links: any; meta: any };
    lowStockCount: number;
    nearExpiryCount: number;
    auth: any;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expiryFilter, setExpiryFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [drugs, setDrugs] = useState<Drug[]>([]);
    const [stores, setStores] = useState<Store[]>([]);

    const { data: addData, setData: setAddData, post, processing: addProcessing, errors: addErrors, reset: resetAdd } = useForm({
        drug_id: '',
        store_id: '',
        quantity: '',
        min_level: '',
        max_level: '',
        batch_no: '',
        expiry_date: '',
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        quantity: '',
        min_level: '',
        max_level: '',
        batch_no: '',
        expiry_date: '',
    });

    const getStockStatus = (quantity: number, minLevel: number) => {
        if (quantity === 0) return 'critical';
        if (quantity <= minLevel) return 'low';
        return 'good';
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getExpiryStatus = (expiryDate?: string) => {
        if (!expiryDate) return 'unknown';
        const days = getDaysUntilExpiry(expiryDate);
        if (days < 0) return 'expired';
        if (days <= 30) return 'expiring-soon';
        if (days <= 90) return 'expiring-warning';
        return 'good';
    };

    const getReorderRecommendation = (quantity: number, minLevel: number, maxLevel: number) => {
        if (quantity === 0) return { status: 'urgent', message: 'Out of stock - Order immediately', quantity: maxLevel };
        if (quantity <= minLevel) return { status: 'high', message: 'Below minimum level', quantity: maxLevel - quantity };
        if (quantity <= minLevel * 1.5) return { status: 'medium', message: 'Consider reordering soon', quantity: maxLevel - quantity };
        return { status: 'good', message: 'Stock adequate', quantity: 0 };
    };

    // Filter inventory based on search term, status, and expiry
    const filteredStock = stock.data?.filter(item => {
        const drugName = item.drug?.generic_name?.toLowerCase() || '';
        const brandName = item.drug?.brand_name?.toLowerCase() || '';
        const strength = item.drug?.strength?.toLowerCase() || '';
        const formulation = item.drug?.formulation?.toLowerCase() || '';
        const batchNo = item.batch_no?.toLowerCase() || '';
        const storeName = item.store?.name?.toLowerCase() || '';
        
        const matchesSearch = drugName.includes(searchTerm.toLowerCase()) ||
                             brandName.includes(searchTerm.toLowerCase()) ||
                             strength.includes(searchTerm.toLowerCase()) ||
                             formulation.includes(searchTerm.toLowerCase()) ||
                             batchNo.includes(searchTerm.toLowerCase()) ||
                             storeName.includes(searchTerm.toLowerCase());
        
        const itemStatus = getStockStatus(item.quantity, item.min_level);
        const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
        
        const expiryStatus = getExpiryStatus(item.expiry_date);
        const matchesExpiry = expiryFilter === 'all' || 
                             (expiryFilter === 'expired' && expiryStatus === 'expired') ||
                             (expiryFilter === 'expiring-soon' && (expiryStatus === 'expiring-soon' || expiryStatus === 'expiring-warning')) ||
                             (expiryFilter === 'good' && expiryStatus === 'good');
        
        return matchesSearch && matchesStatus && matchesExpiry;
    }) || [];

    // Calculate stats for filtered items
    const expiredCount = filteredStock.filter(item => getExpiryStatus(item.expiry_date) === 'expired').length;
    const expiringSoonCount = filteredStock.filter(item => {
        const status = getExpiryStatus(item.expiry_date);
        return status === 'expiring-soon' || status === 'expiring-warning';
    }).length;
    const reorderCount = filteredStock.filter(item => {
        const reorder = getReorderRecommendation(item.quantity, item.min_level, item.max_level);
        return reorder.status === 'urgent' || reorder.status === 'high';
    }).length;

    // Load drugs and stores when modals open
    const loadDropdownData = async () => {
        try {
            const [drugsResponse, storesResponse] = await Promise.all([
                fetch('/pharmacy/inventory/drugs'),
                fetch('/pharmacy/inventory/stores')
            ]);
            const drugsData = await drugsResponse.json();
            const storesData = await storesResponse.json();
            setDrugs(drugsData);
            setStores(storesData);
        } catch (error) {
            console.error('Failed to load dropdown data:', error);
        }
    };

    const handleAddClick = () => {
        loadDropdownData();
        setShowAddModal(true);
    };

    const handleEditClick = (item: InventoryItem) => {
        const expiryStatus = getExpiryStatus(item.expiry_date);
        
        // Allow editing but show warnings for expired/expiring items
        if (expiryStatus === 'expired') {
            if (!confirm(`⚠️ WARNING: This medicine expired on ${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'unknown date'}.\n\nExpired medicines should typically be disposed of safely. Are you sure you want to edit this stock?`)) {
                return;
            }
        } else if (expiryStatus === 'expiring-soon') {
            const daysLeft = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : 0;
            if (!confirm(`⚠️ CAUTION: This medicine expires in ${daysLeft} days (${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'unknown date'}).\n\nConsider prioritizing its use or disposal. Continue editing?`)) {
                return;
            }
        }
        
        setEditingItem(item);
        setEditData({
            quantity: item.quantity.toString(),
            min_level: item.min_level.toString(),
            max_level: item.max_level.toString(),
            batch_no: item.batch_no || '',
            expiry_date: item.expiry_date || '',
        });
        setShowEditModal(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pharmacy/inventory', {
            onSuccess: () => {
                setShowAddModal(false);
                resetAdd();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            put(`/pharmacy/inventory/${editingItem.id}`, {
                onSuccess: () => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    resetEdit();
                }
            });
        }
    };

    const handleDelete = (item: InventoryItem) => {
        const expiryStatus = getExpiryStatus(item.expiry_date);
        let confirmMessage = `Are you sure you want to delete ${item.drug?.generic_name} from inventory?`;
        
        if (expiryStatus === 'expired') {
            confirmMessage = `⚠️ EXPIRED MEDICINE DELETION\n\n${item.drug?.generic_name} expired on ${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'unknown date'}.\n\nIMPORTANT: Ensure expired medicines are disposed of safely according to pharmacy protocols before deleting from inventory.\n\nProceed with deletion?`;
        } else if (item.quantity > 0) {
            confirmMessage = `⚠️ ACTIVE STOCK DELETION\n\n${item.drug?.generic_name} has ${item.quantity} units in stock.\n\nDeleting will remove all stock from inventory. Consider transferring or adjusting quantity instead.\n\nProceed with deletion?`;
        }
        
        if (confirm(confirmMessage)) {
            router.delete(`/pharmacy/inventory/${item.id}`);
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Inventory - Pharmacy" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Inventory</h1>
                                <p className="text-gray-600">Manage drug stock levels and inventory</p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/pharmacy/drugs/create"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                >
                                    ✨ Add New Drug
                                </Link>
                                <button
                                    onClick={handleAddClick}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    + Add Stock
                                </button>
                                <Link
                                    href="/pharmacy/grn/create"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    📦 Create GRN
                                </Link>
                                <Link
                                    href="/pharmacy/grn"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    View GRNs
                                </Link>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-lg">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by drug name, brand, batch number, or store..."
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
                                    <option value="all">All Stock Status</option>
                                    <option value="good">Good Stock</option>
                                    <option value="low">Low Stock</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="sm:w-48">
                                <select
                                    value={expiryFilter}
                                    onChange={(e) => setExpiryFilter(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option value="all">All Expiry Status</option>
                                    <option value="expired">Expired</option>
                                    <option value="expiring-soon">Expiring Soon</option>
                                    <option value="good">Good Expiry</option>
                                </select>
                            </div>
                        </div>
                        {(searchTerm || statusFilter !== 'all' || expiryFilter !== 'all') && (
                            <div className="mt-3 text-sm text-gray-600">
                                Showing {filteredStock.length} of {stock.data?.length || 0} items
                                {expiredCount > 0 && <span className="ml-4 text-red-600">• {expiredCount} expired</span>}
                                {expiringSoonCount > 0 && <span className="ml-4 text-orange-600">• {expiringSoonCount} expiring soon</span>}
                                {reorderCount > 0 && <span className="ml-4 text-yellow-600">• {reorderCount} need reorder</span>}
                            </div>
                        )}
                    </div>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                                    <p className="text-2xl font-bold text-blue-600">{filteredStock.length}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <span className="text-2xl">📦</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                                    <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-50">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                    <p className="text-2xl font-bold text-orange-600">{expiringSoonCount}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-orange-50">
                                    <span className="text-2xl">⏰</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Expired Items</p>
                                    <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-50">
                                    <span className="text-2xl">🚫</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Need Reorder</p>
                                    <p className="text-2xl font-bold text-yellow-600">{reorderCount}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-yellow-50">
                                    <span className="text-2xl">📦</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Current Stock</h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {filteredStock && filteredStock.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Levels</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Info</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStock.map((item) => {
                                            const status = getStockStatus(item.quantity, item.min_level);
                                            const expiryStatus = getExpiryStatus(item.expiry_date);
                                            const reorderInfo = getReorderRecommendation(item.quantity, item.min_level, item.max_level);
                                            const daysUntilExpiry = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;
                                            
                                            return (
                                                <tr key={item.id} className={`hover:bg-gray-50 ${
                                                    expiryStatus === 'expired' ? 'bg-red-50' :
                                                    expiryStatus === 'expiring-soon' ? 'bg-orange-50' :
                                                    status === 'critical' ? 'bg-red-50' : ''
                                                }`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {item.drug?.generic_name || 'Unknown Drug'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {item.drug?.brand_name && `${item.drug.brand_name} • `}
                                                                {item.drug?.strength} {item.drug?.formulation}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.batch_no || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm">
                                                            <div className="font-medium text-gray-900">Current: {item.quantity}</div>
                                                            <div className="text-gray-500">Min: {item.min_level} • Max: {item.max_level}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm">
                                                            <div className={`font-medium ${
                                                                expiryStatus === 'expired' ? 'text-red-600' :
                                                                expiryStatus === 'expiring-soon' ? 'text-orange-600' :
                                                                expiryStatus === 'expiring-warning' ? 'text-yellow-600' :
                                                                'text-gray-900'
                                                            }`}>
                                                                {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                            {daysUntilExpiry !== null && (
                                                                <div className={`text-xs ${
                                                                    expiryStatus === 'expired' ? 'text-red-500' :
                                                                    expiryStatus === 'expiring-soon' ? 'text-orange-500' :
                                                                    'text-gray-500'
                                                                }`}>
                                                                    {expiryStatus === 'expired' 
                                                                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                                                                        : `${daysUntilExpiry} days left`
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm">
                                                            <div className={`font-medium ${
                                                                reorderInfo.status === 'urgent' ? 'text-red-600' :
                                                                reorderInfo.status === 'high' ? 'text-orange-600' :
                                                                reorderInfo.status === 'medium' ? 'text-yellow-600' :
                                                                'text-gray-900'
                                                            }`}>
                                                                {reorderInfo.message}
                                                            </div>
                                                            {reorderInfo.quantity > 0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    Suggest: {reorderInfo.quantity} units
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                status === 'critical' ? 'bg-red-100 text-red-800' :
                                                                status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {status}
                                                            </span>
                                                            {expiryStatus !== 'good' && expiryStatus !== 'unknown' && (
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    expiryStatus === 'expired' ? 'bg-red-100 text-red-800' :
                                                                    'bg-orange-100 text-orange-800'
                                                                }`}>
                                                                    {expiryStatus === 'expired' ? 'expired' : 'expiring'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.store?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditClick(item)}
                                                                className={`transition-colors ${
                                                                    expiryStatus === 'expired' 
                                                                        ? 'text-red-600 hover:text-red-900' 
                                                                        : expiryStatus === 'expiring-soon'
                                                                        ? 'text-orange-600 hover:text-orange-900'
                                                                        : 'text-blue-600 hover:text-blue-900'
                                                                }`}
                                                                title={
                                                                    expiryStatus === 'expired' 
                                                                        ? 'Warning: Expired medicine - edit with caution'
                                                                        : expiryStatus === 'expiring-soon'
                                                                        ? 'Caution: Medicine expiring soon'
                                                                        : 'Edit stock item'
                                                                }
                                                            >
                                                                {expiryStatus === 'expired' ? '⚠️ Edit' : 
                                                                 expiryStatus === 'expiring-soon' ? '⏰ Edit' : 'Edit'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item)}
                                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                                title="Delete stock item"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📦</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {searchTerm || statusFilter !== 'all' ? 'No items match your criteria' : 'No inventory items found'}
                                    </h3>
                                    <p className="text-gray-600">
                                        {searchTerm || statusFilter !== 'all' 
                                            ? 'Try adjusting your search or filter criteria.' 
                                            : 'There are no items in the inventory at the moment.'
                                        }
                                    </p>
                                    {(searchTerm || statusFilter !== 'all' || expiryFilter !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setStatusFilter('all');
                                                setExpiryFilter('all');
                                            }}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Stock Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add Stock for Existing Drug</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select an existing drug from the formulary to add stock. 
                                        <Link href="/pharmacy/drugs/create" className="text-blue-600 hover:underline ml-1">
                                            Create a new drug instead →
                                        </Link>
                                    </p>
                                    <form onSubmit={handleAddSubmit}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Drug</label>
                                                <select
                                                    value={addData.drug_id}
                                                    onChange={(e) => setAddData('drug_id', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                >
                                                    <option value="">Select a drug</option>
                                                    {drugs.map((drug) => (
                                                        <option key={drug.id} value={drug.id}>
                                                            {drug.generic_name} {drug.brand_name && `(${drug.brand_name})`} - {drug.strength} {drug.formulation}
                                                        </option>
                                                    ))}
                                                </select>
                                                {addErrors.drug_id && <p className="text-red-500 text-sm mt-1">{addErrors.drug_id}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Store</label>
                                                <select
                                                    value={addData.store_id}
                                                    onChange={(e) => setAddData('store_id', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">Use default store</option>
                                                    {stores.map((store) => (
                                                        <option key={store.id} value={store.id}>
                                                            {store.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    If no store is selected, the first active store will be used
                                                </p>
                                                {addErrors.store_id && <p className="text-red-500 text-sm mt-1">{addErrors.store_id}</p>}
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={addData.quantity}
                                                        onChange={(e) => setAddData('quantity', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                    {addErrors.quantity && <p className="text-red-500 text-sm mt-1">{addErrors.quantity}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Min Level</label>
                                                    <input
                                                        type="number"
                                                        value={addData.min_level}
                                                        onChange={(e) => setAddData('min_level', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                    {addErrors.min_level && <p className="text-red-500 text-sm mt-1">{addErrors.min_level}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Max Level</label>
                                                    <input
                                                        type="number"
                                                        value={addData.max_level}
                                                        onChange={(e) => setAddData('max_level', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                    {addErrors.max_level && <p className="text-red-500 text-sm mt-1">{addErrors.max_level}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                                                <input
                                                    type="text"
                                                    value={addData.batch_no}
                                                    onChange={(e) => setAddData('batch_no', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Optional"
                                                />
                                                {addErrors.batch_no && <p className="text-red-500 text-sm mt-1">{addErrors.batch_no}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={addData.expiry_date}
                                                    onChange={(e) => setAddData('expiry_date', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {addErrors.expiry_date && <p className="text-red-500 text-sm mt-1">{addErrors.expiry_date}</p>}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddModal(false);
                                                    resetAdd();
                                                }}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={addProcessing}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {addProcessing ? 'Adding...' : 'Add Stock'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Stock Modal */}
                    {showEditModal && editingItem && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Edit Stock: {editingItem.drug?.generic_name}
                                    </h3>
                                    
                                    {/* Expiry Warning Banner */}
                                    {(() => {
                                        const expiryStatus = getExpiryStatus(editingItem.expiry_date);
                                        if (expiryStatus === 'expired') {
                                            return (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex items-center">
                                                        <span className="text-red-600 text-lg mr-2">⚠️</span>
                                                        <div>
                                                            <p className="text-red-800 font-medium">Expired Medicine</p>
                                                            <p className="text-red-600 text-sm">
                                                                Expired on {editingItem.expiry_date ? new Date(editingItem.expiry_date).toLocaleDateString() : 'unknown date'}. 
                                                                Consider safe disposal.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (expiryStatus === 'expiring-soon' || expiryStatus === 'expiring-warning') {
                                            const daysLeft = editingItem.expiry_date ? getDaysUntilExpiry(editingItem.expiry_date) : 0;
                                            return (
                                                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <div className="flex items-center">
                                                        <span className="text-orange-600 text-lg mr-2">⏰</span>
                                                        <div>
                                                            <p className="text-orange-800 font-medium">Expiring Soon</p>
                                                            <p className="text-orange-600 text-sm">
                                                                Expires in {daysLeft} days ({editingItem.expiry_date ? new Date(editingItem.expiry_date).toLocaleDateString() : 'unknown date'}).
                                                                Prioritize usage.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <form onSubmit={handleEditSubmit}>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={editData.quantity}
                                                        onChange={(e) => setEditData('quantity', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                    {editErrors.quantity && <p className="text-red-500 text-sm mt-1">{editErrors.quantity}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Min Level</label>
                                                    <input
                                                        type="number"
                                                        value={editData.min_level}
                                                        onChange={(e) => setEditData('min_level', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                    {editErrors.min_level && <p className="text-red-500 text-sm mt-1">{editErrors.min_level}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Max Level</label>
                                                    <input
                                                        type="number"
                                                        value={editData.max_level}
                                                        onChange={(e) => setEditData('max_level', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                    {editErrors.max_level && <p className="text-red-500 text-sm mt-1">{editErrors.max_level}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                                                <input
                                                    type="text"
                                                    value={editData.batch_no}
                                                    onChange={(e) => setEditData('batch_no', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Optional"
                                                />
                                                {editErrors.batch_no && <p className="text-red-500 text-sm mt-1">{editErrors.batch_no}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={editData.expiry_date}
                                                    onChange={(e) => setEditData('expiry_date', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {editErrors.expiry_date && <p className="text-red-500 text-sm mt-1">{editErrors.expiry_date}</p>}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowEditModal(false);
                                                    setEditingItem(null);
                                                    resetEdit();
                                                }}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={editProcessing}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {editProcessing ? 'Updating...' : 'Update Stock'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HMSLayout>
    );
}