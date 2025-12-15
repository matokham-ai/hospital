import { Head, Link, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import ScheduleSearch from '@/Components/ScheduleSearch';
import SimplePagination from '@/Components/SimplePagination';
import {
    Calendar,
    Users,
    ClipboardList,
    DollarSign,
    Clock,
    UserCheck,
    AlertCircle,
    Search
} from 'lucide-react';

interface DashboardStats {
    todayAppointments: number;
    waitingPatients: number;
    checkedInToday: number;
    pendingPayments: number;
}

interface ScheduleItem {
    time: string;
    patient: string;
    patient_id: string;
    doctor: string;
    type: string;
    status: string;
    id: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface QueueItem {
    name: string;
    patient_id: string;
    waitTime: string;
    status: string;
    queueNumber: number;
    id: number;
}

interface ReceptionistDashboardProps {
    stats?: DashboardStats;
    todaysSchedule?: PaginatedData<ScheduleItem>;
    waitingQueue?: PaginatedData<QueueItem>;
    filters?: {
        schedule_search?: string;
        schedule_status?: string;
        schedule_type?: string;
        queue_search?: string;
    };
}

export default function ReceptionistDashboard({ stats, todaysSchedule, waitingQueue, filters }: ReceptionistDashboardProps) {
    // Provide default values to prevent undefined errors
    const safeStats = stats || {
        todayAppointments: 0,
        waitingPatients: 0,
        checkedInToday: 0,
        pendingPayments: 0,
    };
    const safeTodaysSchedule = todaysSchedule || { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 };
    const safeWaitingQueue = waitingQueue || { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 };
    const safeFilters = filters || {};

    const formatWaitTime = (minutes: number) => {
        const hrs = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const handleScheduleSearch = (searchFilters: { search?: string; status?: string; type?: string }) => {
        const params = new URLSearchParams(window.location.search);
        
        // Clear existing schedule filters
        params.delete('schedule_search');
        params.delete('schedule_status');
        params.delete('schedule_type');
        params.delete('schedule_page');
        
        // Add new filters
        if (searchFilters.search) params.set('schedule_search', searchFilters.search);
        if (searchFilters.status) params.set('schedule_status', searchFilters.status);
        if (searchFilters.type) params.set('schedule_type', searchFilters.type);
        
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSchedulePageChange = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('schedule_page', page.toString());
        
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleQueueSearch = (search: string) => {
        const params = new URLSearchParams(window.location.search);
        
        if (search) {
            params.set('queue_search', search);
        } else {
            params.delete('queue_search');
        }
        params.delete('queue_page');
        
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleQueuePageChange = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('queue_page', page.toString());
        
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };



    const quickActions = [
        {
            name: 'Schedule Appointment',
            href: route('web.appointments.create'),
            icon: Calendar,
            color: 'bg-blue-500',
        },
        {
            name: 'Search Patients',
            href: route('web.patients.index'),
            icon: Users,
            color: 'bg-green-500',
        },
        {
            name: 'Patient Queue',
            href: route('opd.queue'),
            icon: ClipboardList,
            color: 'bg-purple-500',
        },
        {
            name: 'View Invoices',
            href: route('web.invoices.index'),
            icon: DollarSign,
            color: 'bg-orange-500',
        },
    ];

    const statCards = [
        {
            title: "Today's Appointments",
            value: safeStats.todayAppointments,
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Waiting Patients',
            value: safeStats.waitingPatients,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Checked In Today',
            value: safeStats.checkedInToday,
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Pending Payments',
            value: safeStats.pendingPayments,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ];

    return (
        <HMSLayout>
            <Head title="Receptionist Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Receptionist Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Welcome back! Here's what's happening today.
                        </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => (
                        <div
                            key={stat.title}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {stat.title}
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.name}
                                href={action.href}
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {action.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity & Upcoming */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Schedule */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Today's Schedule ({safeTodaysSchedule.total} total)
                            </h2>
                            <ScheduleSearch
                                onSearch={handleScheduleSearch}
                                initialFilters={{
                                    search: safeFilters.schedule_search,
                                    status: safeFilters.schedule_status,
                                    type: safeFilters.schedule_type,
                                }}
                            />
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-3">
                                {safeTodaysSchedule.data.length > 0 ? (
                                    safeTodaysSchedule.data.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {appointment.patient}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    ID: {appointment.patient_id} • {appointment.doctor} • {appointment.type}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {appointment.time}
                                                </span>
                                                <p className={`text-xs mt-1 ${appointment.status === 'confirmed'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : appointment.status === 'checked_in'
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : appointment.status === 'completed'
                                                            ? 'text-purple-600 dark:text-purple-400'
                                                            : appointment.status === 'cancelled'
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {appointment.status.replace('_', ' ').toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        {safeFilters.schedule_search || safeFilters.schedule_status || safeFilters.schedule_type
                                            ? 'No appointments found matching your search criteria'
                                            : 'No appointments scheduled for today'
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {safeTodaysSchedule.last_page > 1 && (
                            <SimplePagination
                                data={safeTodaysSchedule}
                                onPageChange={handleSchedulePageChange}
                            />
                        )}
                    </div>

                    {/* Waiting Queue */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Current Waiting Queue ({safeWaitingQueue.total} total)
                            </h2>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search patients in queue..."
                                        defaultValue={safeFilters.queue_search || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const timeoutId = setTimeout(() => handleQueueSearch(value), 300);
                                            return () => clearTimeout(timeoutId);
                                        }}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-3">
                                {safeWaitingQueue.data.length > 0 ? (
                                    safeWaitingQueue.data.map((patient) => (
                                        <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {patient.name}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    ID: {patient.patient_id} • Queue #{patient.queueNumber} • Waiting: {patient.waitTime}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${patient.status === 'next'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : patient.status === 'in_progress'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}>
                                                {patient.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        {safeFilters.queue_search
                                            ? 'No patients found matching your search'
                                            : 'No patients in waiting queue'
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {safeWaitingQueue.last_page > 1 && (
                            <SimplePagination
                                data={safeWaitingQueue}
                                onPageChange={handleQueuePageChange}
                            />
                        )}
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}