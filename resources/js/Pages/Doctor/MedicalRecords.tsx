import React from 'react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Head } from '@inertiajs/react';
import MedicalRecordsBrowser from '@/Components/Doctor/MedicalRecordsBrowser';

interface DoctorMedicalRecordsPageProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export default function DoctorMedicalRecordsPage({
  userName,
  userEmail,
  userRole
}: DoctorMedicalRecordsPageProps) {
  
  const handleRecordSelect = (record: any) => {
    // Handle record selection
    console.log('Selected medical record:', record);
    
    // In a real app, you might navigate to a detailed view or open an edit modal
    // router.visit(`/medical-records/${record.id}`);
  };

  return (
    <HMSLayout 
      user={{ name: userName || 'Doctor', email: userEmail || '', role: userRole || 'Doctor' }}
      breadcrumbs={[
        { name: 'Dashboard', href: '/doctor/dashboard' },
        { name: 'Medical Records' }
      ]}
    >
      <Head title="Medical Records - MediCare HMS" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <MedicalRecordsBrowser onSelectRecord={handleRecordSelect} />
        </div>
      </div>
    </HMSLayout>
  );
}
