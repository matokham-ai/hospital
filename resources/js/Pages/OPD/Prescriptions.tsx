import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps, OpdAppointment } from '@/types';

interface OpdPrescriptionsProps extends PageProps {
    appointments: {
        data: (OpdAppointment & {
            prescription_status: 'pending' | 'verified' | 'dispensed' | 'cancelled';
            patient_id: string;
            doctor_id: number;
        })[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    prescriptionStats: {
        pending: number;
        verified: number;
        dispensed: number;
    };
}

export default function OpdPrescriptions({ auth, appointments, prescriptionStats }: OpdPrescriptionsProps) {
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const printPrescription = (appointment: OpdAppointment) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print prescriptions');
            return;
        }

        const prescriptionHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prescription - ${appointment.patient?.first_name} ${appointment.patient?.last_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .patient-info { margin-bottom: 20px; }
                    .prescription-body { margin: 20px 0; }
                    .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
                    .doctor-signature { float: right; margin-top: 40px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MediCare Hospital</h1>
                    <p>Prescription</p>
                </div>
                
                <div class="patient-info">
                    <p><strong>Patient:</strong> ${appointment.patient?.first_name} ${appointment.patient?.last_name}</p>
                    <p><strong>Date:</strong> ${formatDate(appointment.appointment_date)}</p>
                    <p><strong>Doctor:</strong> Dr. ${appointment.doctor?.name}</p>
                    <p><strong>Appointment #:</strong> ${appointment.appointment_number}</p>
                </div>
                
                <div class="prescription-body">
                    <h3>Prescription Details:</h3>
                    <p><em>Prescription details will be loaded from SOAP notes...</em></p>
                    <p><strong>Chief Complaint:</strong> ${appointment.chief_complaint || 'Not specified'}</p>
                </div>
                
                <div class="footer">
                    <div class="doctor-signature">
                        <p>_________________________</p>
                        <p>Dr. ${appointment.doctor?.name}</p>
                        <p>Digital Signature</p>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(prescriptionHTML);
        printWindow.document.close();
    };

    const sendToPharmacy = async (appointment: OpdPrescriptionsProps['appointments']['data'][0]) => {
        if (!confirm(`Send prescription for ${appointment.patient?.first_name} ${appointment.patient?.last_name} to pharmacy?`)) {
            return;
        }

        try {
            const response = await fetch(`/opd/prescriptions/send-to-pharmacy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    appointment_id: appointment.id,
                    patient_id: appointment.patient_id,
                    doctor_id: appointment.doctor_id
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`Prescription for ${appointment.patient?.first_name} ${appointment.patient?.last_name} sent to pharmacy successfully!`);
                // Refresh the page to update the status
                window.location.reload();
            } else {
                throw new Error(result.message || 'Failed to send to pharmacy');
            }
        } catch (error) {
            console.error('Error sending to pharmacy:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to send prescription to pharmacy'}`);
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="OPD Prescriptions" />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
                    <p className="text-gray-600 mt-1">View and manage patient prescriptions from completed consultations</p>
                </div>

                {/* Prescriptions List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Today's Prescriptions</h2>
                                <p className="text-gray-600 text-sm mt-1">{appointments.total} prescriptions available</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        // Export functionality - could export to CSV/PDF
                                        alert('Export functionality will be implemented');
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Export All
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Print Queue
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {appointments.data.length > 0 ? (
                            <div className="space-y-4">
                                {appointments.data.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full">
                                                <span className="text-2xl">💊</span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {appointment.patient?.first_name} {appointment.patient?.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Dr. {appointment.doctor?.name}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                    <span>
                                                        Completed: {appointment.consultation_completed_at && formatTime(appointment.consultation_completed_at)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        Date: {formatDate(appointment.appointment_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${appointment.prescription_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    appointment.prescription_status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                                        appointment.prescription_status === 'dispensed' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {appointment.prescription_status === 'pending' && 'PRESCRIPTION READY'}
                                                    {appointment.prescription_status === 'verified' && 'SENT TO PHARMACY'}
                                                    {appointment.prescription_status === 'dispensed' && 'DISPENSED'}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Appointment #{appointment.appointment_number}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => window.location.href = `/opd/consultations/${appointment.id}/notes`}
                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    View SOAP
                                                </button>
                                                <button
                                                    onClick={() => printPrescription(appointment)}
                                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Print Rx
                                                </button>
                                                {appointment.prescription_status === 'pending' && (
                                                    <button
                                                        onClick={() => sendToPharmacy(appointment)}
                                                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                                    >
                                                        Send to Pharmacy
                                                    </button>
                                                )}
                                                {appointment.prescription_status === 'verified' && (
                                                    <button
                                                        onClick={() => alert('Prescription already sent to pharmacy')}
                                                        className="px-3 py-1 bg-gray-400 text-white text-sm rounded-lg cursor-not-allowed"
                                                        disabled
                                                    >
                                                        Sent to Pharmacy
                                                    </button>
                                                )}
                                                {appointment.prescription_status === 'dispensed' && (
                                                    <button
                                                        onClick={() => alert('Prescription has been dispensed')}
                                                        className="px-3 py-1 bg-green-400 text-white text-sm rounded-lg cursor-not-allowed"
                                                        disabled
                                                    >
                                                        Dispensed
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        // More options menu
                                                        alert('More options menu will be implemented');
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <span className="text-lg">⋮</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">💊</div>
                                <p className="text-lg font-medium">No prescriptions available</p>
                                <p className="text-sm">Prescriptions will appear here after consultations are completed</p>
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
                                    {appointments.total} prescriptions
                                </div>
                                <div className="flex items-center gap-2">
                                    {appointments.current_page > 1 && (
                                        <button
                                            onClick={() => window.location.href = `/opd/prescriptions?page=${appointments.current_page - 1}`}
                                            className="px-3 py-1 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Previous
                                        </button>
                                    )}
                                    {appointments.current_page < appointments.last_page && (
                                        <button
                                            onClick={() => window.location.href = `/opd/prescriptions?page=${appointments.current_page + 1}`}
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

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Prescriptions</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{prescriptionStats.pending}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-500">
                                <span className="text-white text-xl">⏳</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Sent to Pharmacy</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{prescriptionStats.verified}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-500">
                                <span className="text-white text-xl">📤</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Dispensed</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{prescriptionStats.dispensed}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500">
                                <span className="text-white text-xl">✅</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}