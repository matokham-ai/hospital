import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { formatKESSimple } from '@/utils/currency';

interface ServiceCatalogue {
    id: number;
    code: string;
    name: string;
    category: string;
    description: string;
    unit_price: number;
    unit_of_measure: string;
    department_id: string;
    department?: {
        deptid: string;
        name: string;
    };
    is_active: boolean;
    is_billable: boolean;
    tax_rate: number;
    created_at: string;
    updated_at: string;
}

interface Department {
    deptid: string;
    name: string;
}

interface CategoryStat {
    category: string;
    count: number;
    avg_price: number;
}

interface Props {
    services: {
        data: ServiceCatalogue[];
        links?: any[];
        meta?: any;
    };
    departments: Department[];
    categoryStats: CategoryStat[];
    filters: {
        category?: string;
        department_id?: string;
        search?: string;
        active?: boolean;
    };
    categories: Record<string, string>;
    auth: any;
}

export default function CategoriesIndex({ services, departments, categoryStats, filters, categories, auth }: Props) {
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedPrice, setEditedPrice] = useState('');
    const [editingDepartment, setEditingDepartment] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    
    const { data: bulkUpdateData, setData: setBulkUpdateData, post: postBulkUpdate, processing: bulkProcessing } = useForm({
        category: '',
        adjustment_type: 'percentage',
        adjustment_value: '',
    });

    const handleBulkUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        postBulkUpdate(route('admin.categories.bulk-update-prices'), {
            onSuccess: () => {
                setShowBulkUpdateModal(false);
                setBulkUpdateData({
                    category: '',
                    adjustment_type: 'percentage',
                    adjustment_value: '',
                });
            }
        });
    };

    const toggleStatus = (serviceId: number) => {
        router.patch(route('admin.categories.toggle-status', serviceId));
    };

    const handleFilter = (key: string, value: string) => {
        router.get(route('admin.categories.index'), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        router.get(route('admin.categories.index'));
    };

    const handleCardClick = (category: string, avgPrice: number) => {
        setEditingCard(category);
        setEditedName(categories[category] || category);
        setEditedPrice(Math.round(avgPrice).toString());
    };

    const handleCardSave = (category: string) => {
        // Send update to backend
        router.patch(route('admin.categories.update-card', category), {
            name: editedName,
            avg_price: parseFloat(editedPrice),
        }, {
            preserveState: true,
            onSuccess: () => {
                setEditingCard(null);
            }
        });
    };

    const handleCardCancel = () => {
        setEditingCard(null);
        setEditedName('');
        setEditedPrice('');
    };

    const handleDepartmentClick = (serviceId: number, currentDeptId: string | null) => {
        setEditingDepartment(serviceId);
        setSelectedDepartment(currentDeptId || '');
    };

    const handleDepartmentSave = (serviceId: number) => {
        router.patch(route('admin.categories.update-department', serviceId), {
            department_id: selectedDepartment || null,
        }, {
            preserveState: true,
            onSuccess: () => {
                setEditingDepartment(null);
            }
        });
    };

    const handleDepartmentCancel = () => {
        setEditingDepartment(null);
        setSelectedDepartment('');
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Service Categories Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
                                <p className="text-gray-600">Manage billing service categories and pricing</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowBulkUpdateModal(true)}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Bulk Update Prices
                                </button>
                                <Link
                                    href={route('admin.categories.create')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add New Service
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Category Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {categoryStats && categoryStats.length > 0 ? categoryStats.map((stat) => (
                            <div 
                                key={stat.category} 
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => editingCard !== stat.category && handleCardClick(stat.category, stat.avg_price)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        {editingCard === stat.category ? (
                                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Category Name</label>
                                                    <input
                                                        type="text"
                                                        value={editedName}
                                                        onChange={(e) => setEditedName(e.target.value)}
                                                        className="w-full px-2 py-1 text-sm font-medium border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Average Price (KES)</label>
                                                    <input
                                                        type="number"
                                                        value={editedPrice}
                                                        onChange={(e) => setEditedPrice(e.target.value)}
                                                        className="w-full px-2 py-1 text-sm font-medium border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleCardSave(stat.category)}
                                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCardCancel}
                                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                                    {categories[stat.category] || stat.category}
                                                    <span className="ml-1 text-xs text-gray-400">✏️</span>
                                                </p>
                                                <p className="text-2xl font-bold text-blue-600">{stat.count}</p>
                                                <p className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                                                    Avg: {formatKESSimple(Math.round(stat.avg_price))} 
                                                    {/* Debug: {JSON.stringify(stat.avg_price)} */}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {editingCard !== stat.category && (
                                        <div className="p-3 rounded-lg bg-blue-50">
                                            <span className="text-2xl">📋</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium mb-2">No Statistics Available</h3>
                                    <p>Add some services to see category statistics.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={filters.category || ''}
                                    onChange={(e) => handleFilter('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    {Object.entries(categories).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    value={filters.department_id || ''}
                                    onChange={(e) => handleFilter('department_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.deptid} value={dept.deptid}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                <input
                                    type="text"
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilter('search', e.target.value)}
                                    placeholder="Search services..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Services Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {services.data && services.data.length > 0 ? services.data.map((service) => (
                                        <tr key={service.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                                    <div className="text-sm text-gray-500">Code: {service.code}</div>
                                                    {service.description && (
                                                        <div className="text-xs text-gray-400 mt-1">{service.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {categories[service.category] || service.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatKESSimple(service.unit_price)}
                                                </div>
                                                {service.unit_of_measure && (
                                                    <div className="text-xs text-gray-500">per {service.unit_of_measure}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {editingDepartment === service.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={selectedDepartment}
                                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                                            className="px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            autoFocus
                                                        >
                                                            <option value="">None</option>
                                                            {departments.map((dept) => (
                                                                <option key={dept.deptid} value={dept.deptid}>
                                                                    {dept.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleDepartmentSave(service.id)}
                                                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={handleDepartmentCancel}
                                                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDepartmentClick(service.id, service.department_id)}
                                                        className="text-left hover:text-blue-600 transition-colors"
                                                    >
                                                        {service.department?.name || (
                                                            <span className="text-gray-400 italic">N/A - Click to set</span>
                                                        )}
                                                        <span className="ml-1 text-xs text-gray-400">✏️</span>
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleStatus(service.id)}
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        service.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {service.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={route('admin.categories.show', service.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={route('admin.categories.edit', service.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    <div className="text-4xl mb-4">📋</div>
                                                    <h3 className="text-lg font-medium mb-2">No services found</h3>
                                                    <p>No services match your current filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {services.meta && services.meta.last_page > 1 && (
                            <div className="px-6 py-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {services.meta.from} to {services.meta.to} of {services.meta.total} results
                                    </div>
                                    <div className="flex gap-2">
                                        {services.links && services.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bulk Update Modal */}
                    {showBulkUpdateModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Bulk Update Prices</h3>
                                
                                <form onSubmit={handleBulkUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            value={bulkUpdateData.category}
                                            onChange={(e) => setBulkUpdateData('category', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Category</option>
                                            {Object.entries(categories).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                                        <select
                                            value={bulkUpdateData.adjustment_type}
                                            onChange={(e) => setBulkUpdateData('adjustment_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {bulkUpdateData.adjustment_type === 'percentage' ? 'Percentage (%)' : 'Amount (KES)'}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bulkUpdateData.adjustment_value}
                                            onChange={(e) => setBulkUpdateData('adjustment_value', e.target.value)}
                                            required
                                            placeholder={bulkUpdateData.adjustment_type === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 500 for KES 500'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={bulkProcessing}
                                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                                        >
                                            {bulkProcessing ? 'Updating...' : 'Update Prices'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowBulkUpdateModal(false)}
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
        </AdminLayout>
    );
}