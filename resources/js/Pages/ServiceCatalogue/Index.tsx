import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Department {
    id: number;
    name: string;
    code?: string;
}

interface Service {
    id: number;
    code: string;
    name: string;
    category: string;
    description?: string;
    unit_price: number;
    unit_of_measure?: string;
    department_id?: number;
    department?: Department;
    is_active: boolean;
    is_billable: boolean;
    tax_rate?: number;
}

interface Props {
    services: {
        data: Service[];
        links: any[];
        meta: any;
    };
    departments: Department[];
    categories: Record<string, string>;
    filters: {
        category?: string;
        search?: string;
    };
    auth: any;
}

export default function ServiceCatalogueIndex({ services, departments, categories, filters, auth }: Props) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        category: '',
        description: '',
        unit_price: '',
        unit_of_measure: '',
        department_id: '',
        is_active: true,
        is_billable: true,
        tax_rate: '',
    });

    // Auto-generate service code when category or department changes
    useEffect(() => {
        const generateCode = async () => {
            if (data.category && !isGeneratingCode && showCreateForm) {
                setIsGeneratingCode(true);
                try {
                    const response = await axios.post('/inpatient/service-catalogue/generate-code', {
                        category: data.category,
                        department_id: data.department_id || null
                    });
                    setData('code', response.data.code);
                } catch (error) {
                    console.error('Error generating service code:', error);
                } finally {
                    setIsGeneratingCode(false);
                }
            }
        };

        generateCode();
    }, [data.category, data.department_id, showCreateForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('inpatient.service-catalogue.store'), {
            onSuccess: () => {
                setShowCreateForm(false);
                reset();
            }
        });
    };

    const handleCreateNew = () => {
        reset();
        setShowCreateForm(true);
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Service Catalogue" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Service Catalogue</h1>
                                <p className="text-gray-600">Manage billing services and pricing</p>
                            </div>
                            <button
                                onClick={handleCreateNew}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                + Create New Service
                            </button>
                        </div>
                    </div>

                    {/* Create Form Modal */}
                    {showCreateForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Create New Service</h2>
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Service Code - Auto-generated */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Service Code
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={data.code}
                                                    readOnly
                                                    placeholder={isGeneratingCode ? "Generating code..." : "Select category to generate code"}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                                />
                                                {isGeneratingCode && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Code will be automatically generated based on category and department
                                            </p>
                                            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                                        </div>

                                        {/* Service Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Service Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., General Consultation"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Category and Department */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category *
                                                </label>
                                                <select
                                                    value={data.category}
                                                    onChange={(e) => setData('category', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    {Object.entries(categories).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Department
                                                </label>
                                                <select
                                                    value={data.department_id}
                                                    onChange={(e) => setData('department_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map((dept) => (
                                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                                {errors.department_id && <p className="text-red-500 text-sm mt-1">{errors.department_id}</p>}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows={2}
                                                placeholder="Detailed description of the service..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                        </div>

                                        {/* Pricing */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit Price (KES) *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.unit_price}
                                                    onChange={(e) => setData('unit_price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                                {errors.unit_price && <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit of Measure
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.unit_of_measure}
                                                    onChange={(e) => setData('unit_of_measure', e.target.value)}
                                                    placeholder="e.g., session, test"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.unit_of_measure && <p className="text-red-500 text-sm mt-1">{errors.unit_of_measure}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tax Rate (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={data.tax_rate}
                                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.tax_rate && <p className="text-red-500 text-sm mt-1">{errors.tax_rate}</p>}
                                            </div>
                                        </div>

                                        {/* Status Settings */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    checked={data.is_active}
                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                                    Active Service
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="is_billable"
                                                    checked={data.is_billable}
                                                    onChange={(e) => setData('is_billable', e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_billable" className="ml-2 block text-sm text-gray-900">
                                                    Billable Service
                                                </label>
                                            </div>
                                        </div>

                                        {/* Submit Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="submit"
                                                disabled={processing || isGeneratingCode}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {processing ? 'Creating...' : 'Create Service'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateForm(false)}
                                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Service
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Department
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {services.data.map((service) => (
                                            <tr key={service.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                                        <div className="text-sm text-gray-500">Code: {service.code}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {categories[service.category] || service.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {service.department?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    KES {service.unit_price.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        service.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {service.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
