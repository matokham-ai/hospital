import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import OpdDashboard from '@/Components/OpdDashboard';
import type { PageProps, DashboardStats, QueueItem, OpdAppointment } from '@/types';

interface OpdIndexProps extends PageProps {
  stats?: DashboardStats;
  queue?: QueueItem[];
  recentAppointments?: OpdAppointment[];
}

export default function OPDIndex({ auth, stats, queue, recentAppointments }: OpdIndexProps) {
  // Mock data for demonstration - in real app this would come from the server
  const mockStats: DashboardStats = stats || {
    totalPatients: 45,
    waitingPatients: 3,
    inConsultation: 1,
    completedToday: 12
  };

  const mockQueue: QueueItem[] = queue || [
    {
      id: 1,
      patient_name: 'John Doe',
      queue_number: 1,
      status: 'checked_in',
      waiting_time: 15,
      doctor_name: 'Dr. Smith'
    },
    {
      id: 2,
      patient_name: 'Jane Smith',
      queue_number: 2,
      status: 'in_consultation',
      waiting_time: 45,
      doctor_name: 'Dr. Johnson'
    }
  ];

  const mockRecentAppointments: OpdAppointment[] = recentAppointments || [
    {
      id: 1,
      appointment_number: 'OPD202510130001',
      patient_id: 1,
      doctor_id: 1,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:30',
      appointment_type: 'WALK_IN',
      status: 'COMPLETED',
      chief_complaint: 'General checkup',
      notes: 'Routine consultation',
      queue_number: 1,
      patient: {
        id: 1,
        medical_record_number: 'MRN001',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+254700000000',
        date_of_birth: '1990-01-01',
        gender: 'M',
        address: 'Nairobi',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+254700000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      doctor: {
        id: 1,
        name: 'Dr. Smith',
        specialization: 'General Medicine',
        is_available: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const handleRefresh = () => {
    // In a real application, this would refetch data from the server
    window.location.reload();
  };

  const handleViewPatient = (patientId: number) => {
    // Navigate to patient details page
    console.log('View patient:', patientId);
  };

  const handleStartConsultation = (appointmentId: number) => {
    // Redirect to queue page for consultation
    window.location.href = '/opd/queue';
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="OPD Dashboard" />
      <div className="min-h-screen bg-gray-50 p-6">
        <OpdDashboard
          stats={mockStats}
          queue={mockQueue}
          recentAppointments={mockRecentAppointments}
          onRefresh={handleRefresh}
          onViewPatient={handleViewPatient}
          onStartConsultation={handleStartConsultation}
        />
      </div>
    </HMSLayout>
  );
}
