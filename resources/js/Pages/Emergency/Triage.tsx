import React, { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import type { PageProps } from '@/types';

interface TriageProps extends PageProps {
  patient: {
    id: number;
    temp_name: string;
    chief_complaint: string;
  };
}

export default function Triage({ auth, patient }: TriageProps) {
  const [formData, setFormData] = useState({
    triage_category: '',
    temperature: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    gcs_eye: '',
    gcs_verbal: '',
    gcs_motor: '',
    assessment_notes: '',
    disposition: '' // emergency or opd
  });

  const gcsTotal = (parseInt(formData.gcs_eye) || 0) + 
                   (parseInt(formData.gcs_verbal) || 0) + 
                   (parseInt(formData.gcs_motor) || 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.post(`/emergency/${patient.id}/triage`, formData);
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="Triage Assessment" />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Triage Assessment</h1>
            <p className="text-gray-600 mt-1">Patient: {patient.temp_name}</p>
            <p className="text-sm text-gray-500">Chief Complaint: {patient.chief_complaint}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Triage Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Triage Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 'red', label: 'RED - Critical', color: 'bg-red-100 border-red-500 text-red-800' },
                    { value: 'yellow', label: 'YELLOW - Urgent', color: 'bg-yellow-100 border-yellow-500 text-yellow-800' },
                    { value: 'green', label: 'GREEN - Non-urgent', color: 'bg-green-100 border-green-500 text-green-800' },
                    { value: 'black', label: 'BLACK - Deceased', color: 'bg-gray-100 border-gray-500 text-gray-800' }
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, triage_category: cat.value })}
                      className={`p-3 border-2 rounded-lg font-medium ${
                        formData.triage_category === cat.value ? cat.color : 'bg-white border-gray-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vitals */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={formData.blood_pressure}
                      onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={formData.heart_rate}
                      onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                    <input
                      type="number"
                      value={formData.respiratory_rate}
                      onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">O2 Saturation (%)</label>
                    <input
                      type="number"
                      value={formData.oxygen_saturation}
                      onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Glasgow Coma Scale */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Glasgow Coma Scale (GCS) 
                  {gcsTotal > 0 && <span className="ml-2 text-blue-600">Total: {gcsTotal}/15</span>}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eye Response (1-4)</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={formData.gcs_eye}
                      onChange={(e) => setFormData({ ...formData, gcs_eye: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verbal Response (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.gcs_verbal}
                      onChange={(e) => setFormData({ ...formData, gcs_verbal: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motor Response (1-6)</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={formData.gcs_motor}
                      onChange={(e) => setFormData({ ...formData, gcs_motor: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Notes</label>
                <textarea
                  rows={4}
                  value={formData.assessment_notes}
                  onChange={(e) => setFormData({ ...formData, assessment_notes: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              {/* Disposition Decision */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Disposition Decision</h3>
                <p className="text-sm text-gray-600 mb-3">Based on triage assessment, where should this patient go?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, disposition: 'emergency' });
                    }}
                    className={`p-4 border-2 rounded-lg font-medium ${
                      formData.disposition === 'emergency' 
                        ? 'bg-red-100 border-red-500 text-red-800' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="text-lg">🚨 Keep in Emergency</div>
                    <div className="text-xs mt-1">Critical/Urgent cases</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, disposition: 'opd' });
                    }}
                    className={`p-4 border-2 rounded-lg font-medium ${
                      formData.disposition === 'opd' 
                        ? 'bg-green-100 border-green-500 text-green-800' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="text-lg">🏥 Send to OPD</div>
                    <div className="text-xs mt-1">Non-urgent consultation</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.visit('/emergency')}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.triage_category || !formData.disposition}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Triage & {formData.disposition === 'emergency' ? 'Keep in Emergency' : 'Send to OPD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
