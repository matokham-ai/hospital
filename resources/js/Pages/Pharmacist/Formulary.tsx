import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Drug {
    id: number;
    name: string;
    generic_name: string;
    brand_name?: string;
    strength: string;
    form: string;
    formulation?: string;
    atc_code?: string;
    therapeutic_class?: string;
    unit_price: number | string;
    cost_price?: number | string;
    stock_quantity: number;
    reorder_level: number;
    manufacturer?: string;
    expiry_date?: string;
    status: string;
    requires_prescription: boolean;
    storage_conditions?: string;
    stock_status?: string;
    stock_badge_color?: string;
    formatted_price?: string;
    profit_margin?: number;
    days_to_expiry?: number;
    is_expired?: boolean;
    is_near_expiry?: boolean;
}

interface Filters {
    search: string;
    form: string;
    therapeutic_class: string;
    stock_status: string;
    prescription: string;
    sort: string;
    order: string;
}

interface FilterOptions {
    forms: string[];
    therapeuticClasses: string[];
}

export default function Formulary({
    drugs,
    filters = {
        search: '',
        form: '',
        therapeutic_class: '',
        stock_status: '',
        prescription: '',
        sort: 'generic_name',
        order: 'asc'
    },
    filterOptions = {
        forms: [],
        therapeuticClasses: []
    },
    auth
}: {
    drugs: { 
        data: Drug[]; 
        links: any; 
        meta: any;
        total: number;
        from: number;
        to: number;
        per_page: number;
        current_page: number;
    };
    filters: Filters;
    filterOptions: FilterOptions;
    auth: any;
}) {
    const [localFilters, setLocalFilters] = useState<Filters>(filters);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Sync local filters with server filters when they change
    useEffect(() => {
        // Ensure all filter values are strings to prevent controlled/uncontrolled component warnings
        const sanitizedFilters = {
            search: filters.search || '',
            form: filters.form || '',
            therapeutic_class: filters.therapeutic_class || '',
            stock_status: filters.stock_status || '',
            prescription: filters.prescription || '',
            sort: filters.sort || 'generic_name',
            order: filters.order || 'asc'
        };
        setLocalFilters(sanitizedFilters);
    }, [filters]);



    // Handle filter changes with debouncing for search
    const handleFilterChange = (key: keyof Filters, value: string) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);

        if (key === 'search') {
            if (searchTimeout) clearTimeout(searchTimeout);
            const timeout = setTimeout(() => {
                router.get('/pharmacy/formulary', newFilters);
            }, 500);
            setSearchTimeout(timeout);
        } else {
            router.get('/pharmacy/formulary', newFilters);
        }
    };

    const handleSort = (column: string) => {
        const newOrder = localFilters.sort === column && localFilters.order === 'asc' ? 'desc' : 'asc';
        handleFilterChange('sort', column);
        handleFilterChange('order', newOrder);
    };

    const getStockStatusBadge = (drug: Drug) => {
        let color = 'bg-green-100 text-green-800';
        let text = 'In Stock';

        if (drug.stock_quantity <= 0) {
            color = 'bg-red-100 text-red-800';
            text = 'Out of Stock';
        } else if (drug.stock_quantity <= drug.reorder_level) {
            color = 'bg-yellow-100 text-yellow-800';
            text = 'Low Stock';
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {text}
            </span>
        );
    };

    const getExpiryBadge = (drug: Drug) => {
        if (!drug.expiry_date) return null;

        const expiryDate = new Date(drug.expiry_date);
        const today = new Date();
        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExpiry < 0) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Expired
                </span>
            );
        } else if (daysToExpiry <= 90) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Expires in {daysToExpiry} days
                </span>
            );
        }

        return null;
    };

    const clearFilters = () => {
        // Reset local filters first
        const clearedFilters = {
            search: '',
            form: '',
            therapeutic_class: '',
            stock_status: '',
            prescription: '',
            sort: 'generic_name',
            order: 'asc'
        };
        
        setLocalFilters(clearedFilters);
        
        // Use router.visit to ensure fresh data
        router.visit('/pharmacy/formulary', {
            method: 'get',
            preserveState: false,
            preserveScroll: false,
            replace: false
        });
    };

    const formatPrice = (price: number | string | undefined | null): string => {
        if (price === undefined || price === null) return '0.00';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Drug Formulary - Pharmacy" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Drug Formulary</h1>
                                <p className="text-gray-600">Search and browse available medications</p>
                            </div>
                            <div className="flex gap-3">
                                <Link 
                                    href="/pharmacy/drugs/create"
                                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
                                >
                                    + Add New Drug
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

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {/* Search */}
                            <div className="xl:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400">🔍</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search drugs..."
                                        value={localFilters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Form Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
                                <select
                                    value={localFilters.form}
                                    onChange={(e) => handleFilterChange('form', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Forms</option>
                                    {filterOptions?.forms?.map(form => (
                                        <option key={form} value={form}>
                                            {form.charAt(0).toUpperCase() + form.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Therapeutic Class Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select
                                    value={localFilters.therapeutic_class}
                                    onChange={(e) => handleFilterChange('therapeutic_class', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Classes</option>
                                    {filterOptions?.therapeuticClasses?.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Stock Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <select
                                    value={localFilters.stock_status}
                                    onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Stock</option>
                                    <option value="in_stock">In Stock</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>

                            {/* Prescription Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                                <select
                                    value={localFilters.prescription}
                                    onChange={(e) => handleFilterChange('prescription', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="1">Prescription Required</option>
                                    <option value="0">Over the Counter</option>
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Drugs List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Drug Formulary ({drugs?.total || 0} total)
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Showing {drugs?.from || 0} to {drugs?.to || 0} of {drugs?.total || 0} results
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {drugs?.data && drugs.data.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th 
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('generic_name')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>Drug Name</span>
                                                    {localFilters.sort === 'generic_name' && (
                                                        <span>{localFilters.order === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                            <th 
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('therapeutic_class')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>Class</span>
                                                    {localFilters.sort === 'therapeutic_class' && (
                                                        <span>{localFilters.order === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('stock_quantity')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>Stock</span>
                                                    {localFilters.sort === 'stock_quantity' && (
                                                        <span>{localFilters.order === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('unit_price')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>Price</span>
                                                    {localFilters.sort === 'unit_price' && (
                                                        <span>{localFilters.order === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {drugs.data.map((drug) => (
                                            <tr key={drug.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {drug.generic_name}
                                                        </div>
                                                        {drug.brand_name && (
                                                            <div className="text-xs text-gray-500">
                                                                Brand: {drug.brand_name}
                                                            </div>
                                                        )}
                                                        {drug.atc_code && (
                                                            <div className="text-xs font-mono text-gray-400">
                                                                {drug.atc_code}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-gray-900">
                                                            {drug.strength} {drug.form}
                                                        </div>
                                                        {drug.formulation && (
                                                            <div className="text-xs text-gray-500">
                                                                {drug.formulation}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center space-x-2">
                                                            {drug.requires_prescription ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Rx
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                    OTC
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {drug.therapeutic_class || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {drug.stock_quantity}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Reorder: {drug.reorder_level}
                                                        </div>
                                                        {getStockStatusBadge(drug)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            KES {formatPrice(drug.unit_price)}
                                                        </div>
                                                        {drug.cost_price && (
                                                            <div className="text-xs text-gray-500">
                                                                Cost: KES {formatPrice(drug.cost_price)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {getExpiryBadge(drug)}
                                                        {drug.storage_conditions && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {drug.storage_conditions}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {drug.manufacturer || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No drugs found
                                    </h3>
                                    <p className="text-gray-600">
                                        {Object.values(localFilters).some(v => v && v !== 'generic_name' && v !== 'asc')
                                            ? 'No medications match your current filters. Try adjusting your search criteria.'
                                            : 'There are no drugs in the formulary at the moment.'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {drugs?.links && drugs.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {drugs?.from || 0} to {drugs?.to || 0} of {drugs?.total || 0} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {drugs.links.map((link: any, index: number) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-2 text-sm rounded-md ${
                                                    link.active
                                                        ? 'bg-blue-500 text-white'
                                                        : link.url
                                                        ? 'text-gray-700 hover:bg-gray-100'
                                                        : 'text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}