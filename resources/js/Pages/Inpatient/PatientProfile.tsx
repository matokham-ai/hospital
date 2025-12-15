import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import VitalChart from './components/VitalChart';

interface Patient {
  id: number;
  name: string;
  bedNumber: string;
  ward: string;
  admissionDate: string;
  diagnosis: string;
  doctor: string;
  age: number;
  gender: string;
}

interface Props {
  patient: Patient;
  vitals: any[];
  medications: any[];
  notes: any[];
  labResults: any[];
}

export default function PatientProfile({ patient, vitals, medications, notes, labResults }: Props) {
  const [activeTab, setActiveTab] = useState('vitals');

  const tabs = [
    { id: 'vitals', name: 'Vitals', icon: '📊' },
    { id: 'medications', name: 'Medications', icon: '💊' },
    { id: 'notes', name: 'Progress Notes', icon: '📝' },
    { id: 'diagnostics', name: 'Diagnostics', icon: '🧪' },
    { id: 'labs', name: 'Lab Results', icon: '🔬' },
    { id: 'nursing', name: 'Nursing Charts', icon: '👩‍⚕️' },
    { id: 'diet', name: 'Diet', icon: '🍽️' },
  ];

  return (
    <HMSLayout>
      <Head title={`Patient: ${patient.name}`} />
      
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex justify-between items-center py-4 px-6">
          <div>
            <h2 className="font-semibold text-xl text-gray-800">
              {patient.name}
            </h2>
            <div className="text-sm text-gray-600">
              Bed {patient.bedNumber} • {patient.ward} • Dr. {patient.doctor}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Admitted</div>
            <div className="font-medium">{patient.admissionDate}</div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Patient Info Card */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <div className="text-lg">{patient.age} years</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="text-lg">{patient.gender}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Diagnosis</label>
                  <div className="text-lg">{patient.diagnosis}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attending Doctor</label>
                  <div className="text-lg">Dr. {patient.doctor}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'vitals' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Vital Signs</h3>
                  <VitalChart vitals={vitals} />
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Blood Pressure</div>
                      <div className="text-2xl font-bold">120/80</div>
                      <div className="text-xs text-green-600">Normal</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Heart Rate</div>
                      <div className="text-2xl font-bold">72 bpm</div>
                      <div className="text-xs text-green-600">Normal</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Temperature</div>
                      <div className="text-2xl font-bold">98.6°F</div>
                      <div className="text-xs text-green-600">Normal</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">SpO2</div>
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-xs text-green-600">Normal</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'medications' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Current Medications</h3>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                      Add Medication
                    </button>
                  </div>
                  <div className="space-y-4">
                    {medications.map((med, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{med.name}</h4>
                            <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                            <p className="text-xs text-gray-500">Started: {med.startDate}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                            <button className="text-red-600 hover:text-red-800 text-sm">Stop</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Progress Notes</h3>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                      Add Note
                    </button>
                  </div>
                  <div className="space-y-4">
                    {notes.map((note, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{note.author}</div>
                          <div className="text-sm text-gray-500">{note.timestamp}</div>
                        </div>
                        <p className="text-gray-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'labs' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Laboratory Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {labResults.map((result, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{result.test}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{result.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.reference}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                result.status === 'high' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add other tab contents as needed */}
            </div>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}