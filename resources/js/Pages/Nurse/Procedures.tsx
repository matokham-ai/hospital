import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Syringe, Clock, CheckCircle, AlertCircle, Filter, MapPin } from 'lucide-react';

interface Procedure {
    id: number;
    patient_id: number;
    patient_name: string;
    mrn: string;
    location: string;
    procedure_type: string;
    description: string;
    scheduled_at: string | null;
    priority: 'stat' | 'urgent' | 'routine' | string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue' | string;
    ordered_by: string;
    assigned_to?: string | null;
    is_overdue: boolean;
}

interface Statistics {
    pending: number;
    in_progress: number;
    completed_today: number;
    overdue: number;
}

interface Filters {
    status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'all';
    priority?: string | null;
    location?: string | null;
}

interface FilterOptions {
    priorities?: string[];
    locations?: string[];
}

interface Props {
    procedures: Procedure[];
    statistics: Statistics;
    filters?: Filters;
    filterOptions?: FilterOptions;
}

const DEFAULT_TABS: Array<{ key: Filters['status']; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
];

const formatSchedule = (value: string | null) => {
    if (!value) {
        return 'Not scheduled';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();
};

const stringGuard = (value: string | null | undefined): value is string => Boolean(value);

export default function Procedures({ procedures, statistics, filters, filterOptions }: Props) {
    const selectedStatus = (filters?.status as Filters['status']) ?? 'pending';
    const selectedPriority = filters?.priority ?? null;
    const selectedLocation = filters?.location ?? null;

    const [completeModal, setCompleteModal] = useState<{ show: boolean; procedure: Procedure | null }>({
        show: false,
        procedure: null,
    });
    const [formData, setFormData] = useState({
        notes: '',
        complications: '',
        completed_at: new Date().toISOString().slice(0, 16),
    });

    const priorityOptions = useMemo(() => {
        if (filterOptions?.priorities && filterOptions.priorities.length > 0) {
            return filterOptions.priorities;
        }

        return Array.from(new Set(procedures.map((procedure) => procedure.priority).filter(stringGuard)));
    }, [filterOptions?.priorities, procedures]);

    const locationOptions = useMemo(() => {
        if (filterOptions?.locations && filterOptions.locations.length > 0) {
            return filterOptions.locations;
        }

        return Array.from(new Set(procedures.map((procedure) => procedure.location).filter(stringGuard)));
    }, [filterOptions?.locations, procedures]);

    const applyFilters = (overrides: Partial<Filters>) => {
        const nextStatus = overrides.status ?? selectedStatus;
        const nextPriority = overrides.priority !== undefined ? overrides.priority : selectedPriority;
        const nextLocation = overrides.location !== undefined ? overrides.location : selectedLocation;

        const query: Record<string, string> = {
            status: nextStatus,
        };

        if (nextPriority) {
            query.priority = nextPriority;
        }

        if (nextLocation) {
            query.location = nextLocation;
        }

        router.get(route('nurse.procedures.index'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'stat':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">STAT</span>;
            case 'urgent':
                return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">URGENT</span>;
            case 'routine':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">ROUTINE</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">{priority}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">PENDING</span>;
            case 'overdue':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">OVERDUE</span>;
            case 'in_progress':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">IN PROGRESS</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">COMPLETED</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">{status}</span>;
        }
    };

    const handleComplete = (procedure: Procedure) => {
        setCompleteModal({ show: true, procedure });
    };

    const submitCompletion = () => {
        if (!completeModal.procedure) {
            return;
        }

        router.post(
            route('nurse.procedures.complete', { procedure: completeModal.procedure.id }),
            formData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCompleteModal({ show: false, procedure: null });
                    setFormData({
                        notes: '',
                        complications: '',
                        completed_at: new Date().toISOString().slice(0, 16),
                    });
                },
            }
        );
    };

    const hasActiveFilters = Boolean(selectedPriority || selectedLocation);

    return (
        <HMSLayout>
            <Head title="Nursing Procedures" />

            <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nursing Procedures</h1>
                        <p className="text-gray-600 mt-1">Live queue of bedside and OPD procedures that require nursing action.</p>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => applyFilters({ priority: null, location: null })}
                            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.pending}</p>
                            </div>
                            <Clock className="h-12 w-12 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.in_progress}</p>
                            </div>
                            <Syringe className="h-12 w-12 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completed Today</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.completed_today}</p>
                            </div>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Overdue</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.overdue}</p>
                            </div>
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="flex flex-col gap-4 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                        <nav className="flex flex-wrap gap-2">
                            {DEFAULT_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => applyFilters({ status: tab.key })}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                        selectedStatus === tab.key
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-100'
                                    }`}
                                    type="button"
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-semibold uppercase text-gray-500">Priority</span>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedPriority ?? 'all'}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        applyFilters({ priority: value === 'all' ? null : value });
                                    }}
                                >
                                    <option value="all">All priorities</option>
                                    {priorityOptions.map((priority) => (
                                        <option key={priority} value={priority}>
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-semibold uppercase text-gray-500">Location</span>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedLocation ?? 'all'}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        applyFilters({ location: value === 'all' ? null : value });
                                    }}
                                >
                                    <option value="all">All locations</option>
                                    {locationOptions.map((location) => (
                                        <option key={location} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {procedures.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No procedures match the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    procedures.map((procedure) => (
                                        <tr
                                            key={procedure.id}
                                            className={`transition-colors hover:bg-gray-50 ${
                                                procedure.is_overdue ? 'bg-red-50' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4 align-top">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{procedure.patient_name}</p>
                                                    <p className="text-sm text-gray-600">MRN: {procedure.mrn}</p>
                                                    <p className="text-sm text-gray-500">{procedure.location || 'Unassigned'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{procedure.procedure_type}</p>
                                                    <p className="text-sm text-gray-600">{procedure.description}</p>
                                                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                        <p>Ordered by: {procedure.ordered_by}</p>
                                                        <p>Patient ID: {procedure.patient_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-sm">
                                                <p className={procedure.is_overdue ? 'font-semibold text-red-600' : 'text-gray-900'}>
                                                    {formatSchedule(procedure.scheduled_at)}
                                                </p>
                                                {procedure.is_overdue && (
                                                    <p className="mt-1 text-xs text-red-500">Follow up immediately</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                {getPriorityBadge(procedure.priority)}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                {getStatusBadge(procedure.status)}
                                            </td>
                                            <td className="px-6 py-4 align-top text-sm text-gray-700">
                                                {procedure.assigned_to ?? 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                {(procedure.status === 'pending' || procedure.status === 'overdue' || procedure.status === 'in_progress') && (
                                                    <button
                                                        onClick={() => handleComplete(procedure)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                        type="button"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {completeModal.show && completeModal.procedure && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">Complete Procedure</h2>

                        <div className="mb-4 p-4 bg-blue-50 rounded">
                            <p className="font-semibold">{completeModal.procedure.patient_name}</p>
                            <p className="text-sm text-gray-600">{completeModal.procedure.procedure_type}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Completed At *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.completed_at}
                                    onChange={(event) => setFormData({ ...formData, completed_at: event.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Notes *</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Document the procedure performed, patient response, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Complications (if any)</label>
                                <textarea
                                    value={formData.complications}
                                    onChange={(event) => setFormData({ ...formData, complications: event.target.value })}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Document any complications or adverse events"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setCompleteModal({ show: false, procedure: null })}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitCompletion}
                                disabled={!formData.notes.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                type="button"
                            >
                                Complete Procedure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HMSLayout>
    );
}
