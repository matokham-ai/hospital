import React from 'react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Head } from '@inertiajs/react';
import MedicineBrowser from '@/Components/Doctor/MedicineBrowser';

interface DoctorMedicinesPageProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export default function DoctorMedicinesPage({
  userName,
  userEmail,
  userRole
}: DoctorMedicinesPageProps) {
  
  const handlePrescribe = (medicine: any, dosage: string, duration: string) => {
    // Handle prescription creation
    console.log('Creating prescription:', {
      medicine: medicine.name,
      dosage,
      duration
    });
    
    // In a real app, you would make an API call here
    // router.post('/prescriptions', { medicine_id: medicine.id, dosage, duration });
  };

  return (
    <HMSLayout 
      user={{ name: userName || 'Doctor', email: userEmail || '', role: userRole || 'Doctor' }}
      breadcrumbs={[
        { name: 'Dashboard', href: '/doctor/dashboard' },
        { name: 'Medicines' }
      ]}
    >
      <Head title="Medicine Browser - MediCare HMS" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <MedicineBrowser 
            showPrescribeButton={true}
            onPrescribe={handlePrescribe}
          />
        </div>
      </div>
    </HMSLayout>
  );
}