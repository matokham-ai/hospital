import { useState } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import SOAPNotesModal from '@/Components/SOAPNotesModal';
import axios from 'axios';
import type { PageProps, QueueItem, DashboardStats } from '@/types';

interface OpdQueueProps extends PageProps {
    queue: QueueItem[];
    stats: DashboardStats;
}

export default function OpdQueue({ auth, queue, stats }: OpdQueueProps) {
    const [soapModalOpen, setSoapModalOpen] = useState(false);
    const [consultationData, setConsultationData] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [queueItems, setQueueItems] = useState<QueueItem[]>(queue);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Add a refresh function to get fresh queue data
    const refreshQueue = async () => {
        try {
            const response = await axios.get('/opd/dashboard-data');
            if (response.data && response.data.queue) {
                setQueueItems(response.data.queue);
                setLastUpdated(new Date());
                console.log('Queue refreshed:', response.data.queue);
            }
        } catch (error) {
            console.error('Failed to refresh queue:', error);
        }
    };


    const formatWaitingTime = (minutes: number) => {
        // Handle invalid or negative values
        if (!minutes || minutes < 0) return '0m';

        // Round to nearest minute
        const roundedMinutes = Math.round(minutes);

        if (roundedMinutes < 60) return `${roundedMinutes}m`;
        const hours = Math.floor(roundedMinutes / 60);
        const remainingMinutes = roundedMinutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatAppointmentTime = (timeString: string | undefined) => {
        if (!timeString) return '';

        try {
            // Handle different time formats
            let time = timeString;

            // If it's a full datetime string, extract just the time part
            if (timeString.includes('T')) {
                time = timeString.split('T')[1];
            }

            // Remove seconds if present (e.g., "14:30:00" -> "14:30")
            if (time.includes(':')) {
                const parts = time.split(':');
                if (parts.length >= 2) {
                    const hours = parseInt(parts[0]);
                    const minutes = parts[1];

                    // Convert to 12-hour format
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

                    return `${displayHours}:${minutes} ${period}`;
                }
            }

            return timeString;
        } catch (error) {
            return timeString;
        }
    };

    // Handle check-in for scheduled appointments
    const handleCheckIn = async (queueItem: QueueItem) => {
        try {
            setActionLoading(true);
            const response = await axios.post(`/opd/appointments/${queueItem.id}/check-in`);

            if (response.data.success) {
                // Refresh the queue to show the updated status
                const refreshResponse = await axios.get('/opd/dashboard-data?t=' + Date.now());
                if (refreshResponse.data.queue) {
                    setQueueItems(refreshResponse.data.queue);
                    setLastUpdated(new Date());
                }
            }
        } catch (error: any) {
            alert(`Failed to check in patient: ${error.response?.data?.message || error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle start consultation with SOAP Notes
    const handleStartConsultation = async (queueItem: QueueItem) => {
        try {
            setActionLoading(true);
            const response = await axios.post(`/appointments/${queueItem.id}/start-consultation`);

            if (response.data.success) {
                // Update queue item status locally
                setQueueItems(prevItems =>
                    prevItems.map(item =>
                        item.id === queueItem.id
                            ? { ...item, status: 'IN_PROGRESS' }
                            : item
                    )
                );

                // Ensure we use the queue item's patient data as the primary source
                // to avoid any mismatch between queue and API response data
                const consultationData = {
                    ...response.data.appointment,
                    patient: {
                        ...response.data.appointment.patient,
                        id: queueItem.patient_id || response.data.appointment.patient?.id,
                        full_name: queueItem.patient_name || response.data.appointment.patient?.full_name,
                        first_name: response.data.appointment.patient?.first_name || queueItem.patient_name?.split(' ')[0],
                        last_name: response.data.appointment.patient?.last_name || queueItem.patient_name?.split(' ').slice(1).join(' '),
                    },
                    appointment_details: {
                        ...response.data.appointment.appointment_details,
                        chief_complaint: response.data.appointment.appointment_details?.chief_complaint || queueItem.chief_complaint,
                    }
                };

                // Set consultation data and open SOAP modal
                setConsultationData(consultationData);
                setSoapModalOpen(true);
            }
        } catch (error: any) {
            alert(`Failed to start consultation: ${error.response?.data?.message || error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle continue consultation (for IN_PROGRESS items)
    const handleContinueConsultation = async (queueItem: QueueItem) => {
        try {
            setActionLoading(true);

            // Determine the correct API endpoint based on appointment type
            const apiEndpoint = queueItem.type === 'opd'
                ? `/appointments/${queueItem.id}` // For OPD appointments, use the regular appointment endpoint
                : `/appointments/${queueItem.id}`; // For scheduled appointments

            console.log('Continue consultation:', {
                queueItemId: queueItem.id,
                queueItemType: queueItem.type,
                apiEndpoint: apiEndpoint
            });

            // For continuing consultation, we need to fetch the appointment data
            // Add cache-busting parameter to ensure fresh data
            const response = await axios.get(`${apiEndpoint}?t=${Date.now()}`);

            if (response.data) {
                // Ensure we use the queue item's patient data as the primary source
                // to avoid any mismatch between queue and appointment data
                const appointmentData = {
                    id: response.data.id,
                    type: queueItem.type || 'opd', // Include the appointment type
                    patient: {
                        id: queueItem.patient_id || response.data.patient?.id,
                        full_name: queueItem.patient_name || response.data.patient?.name,
                        first_name: response.data.patient?.first_name || queueItem.patient_name?.split(' ')[0],
                        last_name: response.data.patient?.last_name || queueItem.patient_name?.split(' ').slice(1).join(' '),
                        date_of_birth: response.data.patient?.date_of_birth,
                        gender: response.data.patient?.gender,
                        phone: response.data.patient?.phone || 'N/A',
                        allergies: response.data.patient?.allergies || [],
                        chronic_conditions: response.data.patient?.chronic_conditions || [],
                        alerts: response.data.patient?.alerts || [],
                    },
                    appointment_details: {
                        date: response.data.appointment_date,
                        time: response.data.appointment_time,
                        chief_complaint: response.data.chief_complaint || queueItem.chief_complaint,
                        notes: response.data.appointment_notes || response.data.notes,
                    }
                };

                console.log('Opening SOAP modal for appointment:', appointmentData.id);
                setConsultationData(appointmentData);
                setSoapModalOpen(true);
            }
        } catch (error: any) {
            console.error('Continue consultation error:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url
            });

            if (error.response?.status === 302 || error.response?.status === 401) {
                alert('Authentication required. Please refresh the page and try again.');
                window.location.reload();
            } else {
                alert(`Failed to continue consultation: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setActionLoading(false);
        }
    };

    // Handle SOAP modal completion
    const handleSOAPComplete = async () => {
        setSoapModalOpen(false);
        setConsultationData(null);

        // Refresh the queue to get updated data
        await refreshQueue();

        // Remove the completed consultation from the queue immediately
        if (consultationData?.id) {
            setQueueItems(prevItems => {
                const filteredItems = prevItems.filter(item => item.id !== consultationData.id);
                return filteredItems;
            });
        }

        setConsultationData(null);

        // Refresh queue data from server to ensure consistency
        // Add a small delay to ensure database transaction is committed
        setTimeout(async () => {
            try {
                const response = await axios.get('/opd/dashboard-data?t=' + Date.now()); // Cache busting
                if (response.data.queue) {
                    setQueueItems(response.data.queue);
                    setLastUpdated(new Date());
                }
            } catch (error) {
                // Silently handle refresh errors
            }
        }, 500); // 500ms delay
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="OPD Queue Management" />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Patient Queue</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} • Manage patient queue and appointments
                        </p>
                    </div>
                    <button
                        onClick={refreshQueue}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        🔄 Refresh Queue
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-400">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await axios.get('/opd/dashboard-data?t=' + Date.now());
                                    if (response.data.queue) {
                                        setQueueItems(response.data.queue);
                                        setLastUpdated(new Date());
                                    }
                                } catch (error) {
                                    console.error('Failed to refresh queue:', error);
                                }
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                        >
                            🔄 Refresh Queue
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Waiting</p>
                                <p className="text-3xl font-bold text-orange-500 mt-2">{stats.waitingPatients}</p>
                                <p className="text-xs text-gray-400 mt-1">patients in queue</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Consulting</p>
                                <p className="text-3xl font-bold text-blue-500 mt-2">{stats.inConsultation}</p>
                                <p className="text-xs text-gray-400 mt-1">active consultation</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Completed Today</p>
                                <p className="text-3xl font-bold text-green-500 mt-2">{stats.completedToday}</p>
                                <p className="text-xs text-gray-400 mt-1">consultations done</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                                <p className="text-3xl font-bold text-gray-700 mt-2">{stats.totalPatients}</p>
                                <p className="text-xs text-gray-400 mt-1">today</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Consultation Queue</h2>
                                <p className="text-gray-500 text-sm mt-1">Outpatient consultation workflow</p>
                            </div>
                            <div className="text-sm text-gray-500">
                                {queueItems.length} {queueItems.length === 1 ? 'patient' : 'patients'}
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {queueItems.length > 0 ? (
                            <div className="space-y-4">
                                {queueItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg ${item.status === 'SCHEDULED'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-teal-100 text-teal-700'
                                                }`}>
                                                {item.status === 'SCHEDULED'
                                                    ? '📅'
                                                    : String(item.queue_number || 0).padStart(3, '0')
                                                }
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{item.patient_name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {item.status === 'SCHEDULED'
                                                        ? `Scheduled for ${formatAppointmentTime(item.appointment_time)}`
                                                        : `#${item.queue_number} • ${formatWaitingTime(item.waiting_time)}`
                                                    }
                                                </p>

                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {item.status === 'SCHEDULED' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                                                        📅 Scheduled {formatAppointmentTime(item.appointment_time)}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCheckIn(item)}
                                                        disabled={actionLoading}
                                                        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                                                    >
                                                        {actionLoading ? "Checking in..." : "Check In"}
                                                    </button>
                                                </div>
                                            )}
                                            {item.status === 'WAITING' && (
                                                <>
                                                    {item.triage_status === 'pending' ? (
                                                        <a
                                                            href={`/opd/triage/${item.id}`}
                                                            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors font-medium inline-block"
                                                        >
                                                            🩺 Go to Triage
                                                        </a>
                                                    ) : item.triage_status === 'completed' ? (
                                                        <div className="flex items-center gap-2">
                                                            {item.triage_level && (
                                                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                                                    item.triage_level === 'emergency' ? 'bg-red-100 text-red-700' :
                                                                    item.triage_level === 'urgent' ? 'bg-orange-100 text-orange-700' :
                                                                    item.triage_level === 'non-urgent' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {item.triage_level === 'emergency' ? '🚨 EMERGENCY' :
                                                                     item.triage_level === 'urgent' ? '⚠️ URGENT' :
                                                                     item.triage_level === 'non-urgent' ? '📋 NON-URGENT' :
                                                                     '✅ ROUTINE'}
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => handleStartConsultation(item)}
                                                                disabled={actionLoading}
                                                                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                                                            >
                                                                {actionLoading ? "Starting..." : "Start Consultation →"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStartConsultation(item)}
                                                            disabled={actionLoading}
                                                            className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                                                        >
                                                            {actionLoading ? "Starting..." : "Start Consultation →"}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {item.status === 'IN_PROGRESS' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                                                        ● Consulting
                                                    </div>
                                                    <button
                                                        onClick={() => handleContinueConsultation(item)}
                                                        disabled={actionLoading}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading ? "Loading..." : "Continue"}
                                                    </button>
                                                </div>
                                            )}
                                            {item.status === 'COMPLETED' && (
                                                <div className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                                                    ✓ Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">📋</div>
                                <p className="text-lg font-medium">No patients in queue today</p>
                                <p className="text-sm">Scheduled appointments and walk-ins will appear here</p>
                                <p className="text-xs mt-2 text-gray-400">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SOAP Notes Modal */}
                {soapModalOpen && consultationData && (
                    <SOAPNotesModal
                        isOpen={soapModalOpen}
                        onClose={() => {
                            setSoapModalOpen(false);
                            setConsultationData(null);
                        }}
                        onComplete={handleSOAPComplete}
                        appointmentId={consultationData.id}
                        patient={consultationData.patient}
                        appointmentDetails={consultationData.appointment_details}
                    />
                )}
            </div>
        </HMSLayout>
    );
}
