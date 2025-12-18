import React, { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import PatientSearch from '@/Components/Emergency/PatientSearch';
import type { PageProps } from '@/types';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
}

export default function Create({ auth }: PageProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [useExisting, setUseExisting] = useState(true);
  const [formData, setFormData] = useState({
    patient_id: '',
    temp_name: '',
    temp_contact: '',
    age: '',
    gender: '',
    arrival_mode: 'walk-in',
    chief_complaint: '',
    history_of_present_illness: ''
  });

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
      
      // Map database gender codes to form values
      const genderMap: { [key: string]: string } = {
        'M': 'male',
        'F': 'female',
        'O': 'other',
        'm': 'male',
        'f': 'female',
        'o': 'other'
      };
      
      setFormData({
        ...formData,
        patient_id: patient.id,
        temp_name: `${patient.first_name} ${patient.last_name}`,
        temp_contact: patient.phone || '',
        age: age.toString(),
        gender: genderMap[patient.gender] || ''
      });
    } else {
      setFormData({
        ...formData,
        patient_id: '',
        temp_name: '',
        temp_contact: '',
        age: '',
        gender: ''
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (useExisting && !selectedPatient) {
      alert('Please select a patient or switch to "New/Unknown Patient"');
      return;
    }
    
    console.log('Submitting emergency patient:', formData);
    
    router.post('/emergency', formData, {
      onSuccess: () => {
        console.log('Emergency patient registered successfully');
      },
      onError: (errors) => {
        console.error('Registration errors:', errors);
        alert('Error registering patient. Check console for details.');
      }
    });
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="Register Emergency Patient" />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Register Emergency Patient</h1>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Patient Selection Toggle */}
              <div className="mb-6 flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={useExisting}
                    onChange={() => setUseExisting(true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Search Existing Patient</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!useExisting}
                    onChange={() => {
                      setUseExisting(false);
                      setSelectedPatient(null);
                      setFormData({
                        ...formData,
                        patient_id: '',
                        temp_name: '',
                        temp_contact: '',
                        age: '',
                        gender: ''
                      });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">New/Unknown Patient</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {useExisting ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Patient <span className="text-red-500">*</span>
                    </label>
                    <PatientSearch
                      onSelect={handlePatientSelect}
                      placeholder="Search by name, phone, or MRN..."
                    />
                    {selectedPatient && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <strong>Selected:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                          {selectedPatient.phone && ` • ${selectedPatient.phone}`}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
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
                      placeholder="Enter patient name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact
                  </label>
                  <input
                    type="text"
                    value={formData.temp_contact}
                    onChange={(e) => setFormData({ ...formData, temp_contact: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    disabled={useExisting && !!selectedPatient}
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
                    disabled={useExisting && !!selectedPatient}
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
                    disabled={useExisting && !!selectedPatient}
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
                  onClick={() => router.visit('/emergency')}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Register & Proceed to Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
