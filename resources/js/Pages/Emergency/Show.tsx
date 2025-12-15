import React, { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import DoctorSearch from '@/Components/Emergency/DoctorSearch';
import type { PageProps } from '@/types';

interface EmergencyOrder {
  id: number;
  order_type: string;
  order_name: string;
  priority: string;
  status: string;
  ordered_at: string;
}

interface ShowProps extends PageProps {
  patient: {
    id: number;
    temp_name: string;
    age?: number;
    gender?: string;
    chief_complaint: string;
    arrival_time: string;
    arrival_mode: string;
    status: string;
    assigned_to?: string;
    triageAssessments?: Array<{
      triage_category: string;
      temperature?: number;
      blood_pressure?: string;
      heart_rate?: number;
      gcs_total?: number;
      assessed_at: string;
    }>;
    orders?: EmergencyOrder[];
    assigned_doctor?: {
      physician_code: string;
      name: string;
    };
  };
}

export default function Show({ auth, patient }: ShowProps) {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showAssignDoctor, setShowAssignDoctor] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(patient.assigned_to || '');
  const [orderData, setOrderData] = useState({
    order_type: 'lab',
    order_name: '',
    order_details: '',
    priority: 'routine'
  });

  const latestTriage = patient.triageAssessments?.[0];

  const handleOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.post(`/emergency/${patient.id}/orders`, orderData, {
      onSuccess: () => {
        setShowOrderForm(false);
        setOrderData({ order_type: 'lab', order_name: '', order_details: '', priority: 'routine' });
      }
    });
  };

  const handleTransfer = (destination: string) => {
    if (confirm(`Transfer patient to ${destination}?`)) {
      router.post(`/emergency/${patient.id}/transfer`, { destination });
    }
  };

  const handleAssignDoctor = () => {
    if (!selectedDoctor) {
      alert('Please select a doctor');
      return;
    }
    router.post(`/emergency/${patient.id}/assign-doctor`, { doctor_id: selectedDoctor }, {
      onSuccess: () => setShowAssignDoctor(false)
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
      router.delete(`/emergency/${patient.id}`);
    }
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title={`Emergency - ${patient.temp_name}`} />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patient.temp_name}</h1>
              <p className="text-gray-600 mt-1">
                {patient.age && `${patient.age} years`} {patient.gender && `• ${patient.gender}`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssignDoctor(!showAssignDoctor)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Assign Doctor
              </button>
              <button
                onClick={() => router.visit(`/emergency/${patient.id}/edit`)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
              >
                Edit Details
              </button>
              <button
                onClick={() => handleTransfer('ward')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Transfer to Ward
              </button>
              <button
                onClick={() => handleTransfer('icu')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Transfer to ICU
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Assign Doctor Modal */}
          {showAssignDoctor && (
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Assign Doctor</h3>
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                  <DoctorSearch
                    onSelect={(doctor) => {
                      setSelectedDoctor(doctor ? String(doctor.id) : '');
                    }}
                    placeholder="Search and select a doctor..."
                    initialDoctorId={patient.assigned_to}
                    initialDoctorName={patient.assigned_doctor?.name}
                  />
                </div>
                <button
                  onClick={handleAssignDoctor}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Assign
                </button>
                <button
                  onClick={() => setShowAssignDoctor(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            {/* Patient Info */}
            <div className="col-span-2 space-y-6">
              {/* Triage Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Triage Assessment</h2>
                {latestTriage ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Category:</span>
                      <div className="mt-1">
                        <span className={`px-3 py-1 text-sm font-semibold rounded ${
                          latestTriage.triage_category === 'red' ? 'bg-red-100 text-red-800' :
                          latestTriage.triage_category === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {latestTriage.triage_category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">GCS:</span>
                      <div className="text-lg font-semibold">{latestTriage.gcs_total || 'N/A'}/15</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Temperature:</span>
                      <div className="text-lg font-semibold">{latestTriage.temperature || 'N/A'}°C</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">BP:</span>
                      <div className="text-lg font-semibold">{latestTriage.blood_pressure || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Heart Rate:</span>
                      <div className="text-lg font-semibold">{latestTriage.heart_rate || 'N/A'} bpm</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No triage assessment yet</p>
                )}
              </div>

              {/* Orders */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Emergency Orders</h2>
                  <button
                    onClick={() => setShowOrderForm(!showOrderForm)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + New Order
                  </button>
                </div>

                {showOrderForm && (
                  <form onSubmit={handleOrderSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                        <select
                          value={orderData.order_type}
                          onChange={(e) => setOrderData({ ...orderData, order_type: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm"
                        >
                          <option value="lab">Lab</option>
                          <option value="imaging">Imaging</option>
                          <option value="medication">Medication</option>
                          <option value="procedure">Procedure</option>
                          <option value="consultation">Consultation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={orderData.priority}
                          onChange={(e) => setOrderData({ ...orderData, priority: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm"
                        >
                          <option value="stat">STAT</option>
                          <option value="urgent">Urgent</option>
                          <option value="routine">Routine</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Name</label>
                        <input
                          type="text"
                          required
                          value={orderData.order_name}
                          onChange={(e) => setOrderData({ ...orderData, order_name: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <textarea
                          rows={2}
                          value={orderData.order_details}
                          onChange={(e) => setOrderData({ ...orderData, order_details: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowOrderForm(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Create Order
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {patient.orders && patient.orders.length > 0 ? (
                    patient.orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{order.order_name}</div>
                            <div className="text-sm text-gray-500">
                              {order.order_type} • {order.priority}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No orders yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-3">Patient Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Arrival:</span>
                    <div className="font-medium">
                      {new Date(patient.arrival_time).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Mode:</span>
                    <div className="font-medium">{patient.arrival_mode}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium capitalize">{patient.status}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned Doctor:</span>
                    <div className="font-medium">
                      {patient.assigned_doctor?.name || (
                        <span className="text-red-500">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-3">Chief Complaint</h3>
                <p className="text-sm text-gray-700">{patient.chief_complaint}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
