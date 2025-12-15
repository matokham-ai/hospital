import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { PageProps } from '@/types';

interface LabOrder {
    id: number;
    patient_name: string;
    patient_mrn: string;
    test_name: string;
    ordered_at: string;
    status: 'pending' | 'in_progress' | 'completed' | 'critical';
    priority: 'routine' | 'urgent' | 'stat';
    ordered_by: string;
    result_value?: string;
    reference_range?: string;
    is_critical?: boolean;
}

interface Props extends PageProps {
    pending_orders: LabOrder[];
    recent_results: LabOrder[];
    critical_alerts: LabOrder[];
}

export default function LabResults({ auth, pending_orders = [], recent_results = [], critical_alerts = [] }: Props) {
    const [activeTab, setActiveTab] = useState<'pending' | 'results' | 'critical'>('pending');

    const getPriorityBadge = (priority: string) => {
        const colors = {
            stat: 'bg-red-100 text-red-800',
            urgent: 'bg-orange-100 text-orange-800',
            routine: 'bg-gray-100 text-gray-800'
        };
        return colors[priority as keyof typeof colors] || colors.routine;
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            critical: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    const renderOrders = (orders: LabOrder[]) => {
        if (orders.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2">No lab orders found</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id} className={order.is_critical ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{order.patient_name}</div>
                                    <div className="text-sm text-gray-500">MRN: {order.patient_mrn}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{order.test_name}</div>
                                    {order.result_value && (
                                        <div className="text-sm text-gray-500">
                                            Result: {order.result_value} {order.reference_range && `(${order.reference_range})`}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(order.priority)}`}>
                                        {order.priority.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.ordered_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {order.status === 'pending' && (
                                        <Link
                                            href={`/nurse/lab-results/${order.id}/entry`}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Enter Result
                                        </Link>
                                    )}
                                    <Link
                                        href={`/nurse/lab-results/${order.id}`}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Lab Results" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Lab Results Management</h1>
                        <p className="mt-1 text-sm text-gray-600">View and manage laboratory orders and results</p>
                    </div>

                    {/* Critical Alerts Banner */}
                    {critical_alerts.length > 0 && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {critical_alerts.length} Critical Lab {critical_alerts.length === 1 ? 'Result' : 'Results'} Require Attention
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <button
                                            onClick={() => setActiveTab('critical')}
                                            className="font-medium underline hover:text-red-600"
                                        >
                                            View critical results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                                            <dd className="text-lg font-semibold text-gray-900">{pending_orders.length}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Recent Results</dt>
                                            <dd className="text-lg font-semibold text-gray-900">{recent_results.length}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Critical Alerts</dt>
                                            <dd className="text-lg font-semibold text-gray-900">{critical_alerts.length}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`${
                                        activeTab === 'pending'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Pending Orders ({pending_orders.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('results')}
                                    className={`${
                                        activeTab === 'results'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Recent Results ({recent_results.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('critical')}
                                    className={`${
                                        activeTab === 'critical'
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Critical Alerts ({critical_alerts.length})
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'pending' && renderOrders(pending_orders)}
                            {activeTab === 'results' && renderOrders(recent_results)}
                            {activeTab === 'critical' && renderOrders(critical_alerts)}
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}