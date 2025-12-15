import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps } from '@/types';

interface ConsultationItem {
    id: number;
    type: 'opd' | 'regular';
    appointment_number: string;
    patient: {
        id: number;
        first_name: string;
        last_name: string;
    };
    doctor?: {
        id: number | string;
        name: string;
    };
    appointment_date: string;
    appointment_time?: string;
    status: string;
    chief_complaint?: string;
    queue_number?: number;
    consultation_started_at?: string;
    consultation_completed_at?: string;
    has_soap_notes?: boolean;
}

interface OpdConsultationsProps extends PageProps {
    appointments: {
        data: ConsultationItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function OpdConsultations({ auth, appointments }: OpdConsultationsProps) {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleContinueConsultation = (appointmentId: number) => {
        // Navigate to consultation interface or SOAP notes
        window.location.href = `/opd/consultations/${appointmentId}/soap`;
    };

    const handleCompleteConsultation = async (appointmentId: number) => {
        if (confirm('Are you sure you want to complete this consultation?')) {
            try {
                const response = await fetch(`/appointments/${appointmentId}/complete-consultation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Failed to complete consultation');
                }
            } catch (error) {
                console.error('Error completing consultation:', error);
                alert('Error completing consultation');
            }
        }
    };

    const handleViewNotes = (appointmentId: number) => {
        // Navigate to view SOAP notes
        window.location.href = `/opd/consultations/${appointmentId}/notes`;
    };

    const handleViewPatient = (patientId: string | number) => {
        // Navigate to patient details
        window.location.href = `/patients/${patientId}`;
    };

    const getAppointmentIdentifier = (appointment: ConsultationItem) => {
        if (appointment.type === 'opd' && appointment.queue_number) {
            return appointment.queue_number.toString();
        }
        return appointment.appointment_time || 'N/A';
    };

    const handlePagination = (page: number) => {
        window.location.href = `/opd/consultations?page=${page}`;
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (start: string, end?: string) => {
        try {
            const startTime = new Date(start);
            const endTime = end ? new Date(end) : new Date();
            const diffMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            
            // Handle invalid or negative durations
            if (isNaN(diffMinutes) || diffMinutes < 0) return '0m';
            
            if (diffMinutes < 60) return `${diffMinutes}m`;
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return `${hours}h ${minutes}m`;
        } catch (error) {
            return '0m';
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="OPD Consultations" />
            
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Active Consultations</h1>
                    <p className="text-gray-600 mt-1">Monitor ongoing and completed consultations</p>
                </div>

                {/* Consultations List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Today's Consultations</h2>
                                <p className="text-gray-600 text-sm mt-1">{appointments.total} consultations</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Walk-in</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Scheduled</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">In Progress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Completed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {appointments.data.length > 0 ? (
                            <div className="space-y-4">
                                {appointments.data.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
                                                appointment.type === 'opd' 
                                                    ? 'bg-blue-100 text-blue-600' 
                                                    : 'bg-purple-100 text-purple-600'
                                            }`}>
                                                {getAppointmentIdentifier(appointment)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900">
                                                        <button 
                                                            onClick={() => handleViewPatient(appointment.patient.id)}
                                                            className="hover:text-blue-600 transition-colors cursor-pointer"
                                                        >
                                                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                                                        </button>
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        appointment.type === 'opd' 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {appointment.type === 'opd' ? 'Walk-in' : 'Scheduled'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {appointment.doctor?.name ? `Dr. ${appointment.doctor.name}` : 'No doctor assigned'}
                                                </p>
                                                {appointment.chief_complaint && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Chief Complaint: {appointment.chief_complaint}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status.replace('_', ' ').toUpperCase()}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {appointment.consultation_started_at && (
                                                        <div>
                                                            Started: {formatTime(appointment.consultation_started_at)}
                                                        </div>
                                                    )}
                                                    {appointment.consultation_started_at && (
                                                        <div>
                                                            Duration: {formatDuration(
                                                                appointment.consultation_started_at,
                                                                appointment.consultation_completed_at
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {appointment.status === 'IN_PROGRESS' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleContinueConsultation(appointment.id)}
                                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            Continue
                                                        </button>

                                                    </>
                                                )}
                                                {appointment.status === 'COMPLETED' && (
                                                    <button 
                                                        onClick={() => handleViewNotes(appointment.id)}
                                                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        View Notes
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleViewPatient(appointment.patient.id)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                    title="View Patient Details"
                                                >
                                                    <span className="text-lg">👤</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">🩺</div>
                                <p className="text-lg font-medium">No active consultations</p>
                                <p className="text-sm">Consultations will appear here when doctors start seeing patients</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {appointments.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {((appointments.current_page - 1) * appointments.per_page) + 1} to{' '}
                                    {Math.min(appointments.current_page * appointments.per_page, appointments.total)} of{' '}
                                    {appointments.total} consultations
                                </div>
                                <div className="flex items-center gap-2">
                                    {appointments.current_page > 1 && (
                                        <button 
                                            onClick={() => handlePagination(appointments.current_page - 1)}
                                            className="px-3 py-1 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Previous
                                        </button>
                                    )}
                                    {appointments.current_page < appointments.last_page && (
                                        <button 
                                            onClick={() => handlePagination(appointments.current_page + 1)}
                                            className="px-3 py-1 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Next
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HMSLayout>
    );
}