import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import DoctorSearch from '@/Components/Emergency/DoctorSearch';
import type { PageProps } from '@/types';

interface EditProps extends PageProps {
  patient: {
    id: number;
    patient_id?: string;
    temp_name: string;
    temp_contact?: string;
    age?: number;
    gender?: string;
    arrival_mode: string;
    chief_complaint: string;
    history_of_present_illness?: string;
    status: string;
    assigned_to?: string;
    assigned_doctor?: {
      physician_code: string;
      name: string;
    };
  };
}

export default function Edit({ auth, patient }: EditProps) {
  const [formData, setFormData] = useState({
    temp_name: patient.temp_name || '',
    temp_contact: patient.temp_contact || '',
    age: patient.age?.toString() || '',
    gender: patient.gender || '',
    arrival_mode: patient.arrival_mode || 'walk-in',
    chief_complaint: patient.chief_complaint || '',
    history_of_present_illness: patient.history_of_present_illness || '',
    assigned_to: patient.assigned_to || ''
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    router.put(`/emergency/${patient.id}`, formData, {
      onSuccess: () => {
        router.visit(`/emergency/${patient.id}`);
      },
      onError: (errors) => {
        console.error('Update errors:', errors);
        alert('Error updating patient. Check console for details.');
      }
    });
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="Edit Emergency Patient" />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Emergency Patient</h1>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.temp_name}
                    onChange={(e) => setFormData({ ...formData, temp_name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact
                  </label>
                  <input
                    type="text"
                    value={formData.temp_contact}
                    onChange={(e) => setFormData({ ...formData, temp_contact: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.arrival_mode}
                    onChange={(e) => setFormData({ ...formData, arrival_mode: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    <option value="walk-in">Walk-in</option>
                    <option value="ambulance">Ambulance</option>
                    <option value="police">Police</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Doctor
                  </label>
                  <DoctorSearch
                    onSelect={(doctor) => {
                      setFormData({ ...formData, assigned_to: doctor ? doctor.id.toString() : '' });
                    }}
                    placeholder="Search and select a doctor..."
                    initialDoctorId={patient.assigned_to}
                    initialDoctorName={patient.assigned_doctor?.name}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chief Complaint <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.chief_complaint}
                    onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    History of Present Illness
                  </label>
                  <textarea
                    rows={3}
                    value={formData.history_of_present_illness}
                    onChange={(e) => setFormData({ ...formData, history_of_present_illness: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.visit(`/emergency/${patient.id}`)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Update Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
