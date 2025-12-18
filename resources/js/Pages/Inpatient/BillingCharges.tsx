import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import axios from 'axios';

interface BillItem {
  id: number;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  addedBy: string;
}

interface PatientBill {
  id: number;
  patientId: number;
  patientName: string;
  bedNumber: string;
  admissionDate: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'discharged' | 'paid';
}

interface Service {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  unit_price: number;
  unit_of_measure: string;
}

interface Props {
  services: Record<string, Service[]>;
}

export default function BillingCharges({ services = {} }: Props) {
  console.log('Services prop:', services);

  // Function to get descriptive category labels
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'C': '🩺 Consultation',
      'L': '🧪 Laboratory Test',
      'R': '📷 Radiology/Imaging',
      'M': '💊 Medication',
      'P': '🔧 Medical Procedure',
      'B': '🏥 Room & Board',
      'S': '🧤 Medical Supplies',
      'consultation': '🩺 Consultation',
      'lab_test': '🧪 Laboratory Test',
      'imaging': '📷 Radiology/Imaging',
      'medication': '💊 Medication',
      'procedure': '🔧 Medical Procedure',
      'bed_charge': '🏥 Room & Board',
      'consumable': '🧤 Medical Supplies',
      'nursing': '👩‍⚕️ Nursing Care',
      'other': '📋 Other Services'
    };
    return categoryMap[category] || `📋 ${category}`;
  };
  const [patients, setPatients] = useState<PatientBill[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [newCharge, setNewCharge] = useState({
    serviceId: '',
    quantity: 1,
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    category: '',
    quantity: 1,
    unitPrice: 0,
  });

  // ✅ 1. Fetch all patients on load
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/inpatient/api/bill-items');
      console.log('API Response:', res.data);
      const data = res.data.data;
      console.log('Patients data:', data);
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. Fetch selected patient's bill items dynamically
  const fetchPatientDetails = async (patient: PatientBill) => {
    try {
      console.log('=== STARTING fetchPatientDetails ===');
      console.log('Patient data:', patient);
      setLoadingPatient(true);
      
      const url = `/inpatient/api/bill-items/${patient.id}`;
      console.log('Making API call to:', url);
      
      const res = await axios.get(url);
      console.log('API Response:', res.data);

      const updatedPatient = {
        ...patient,
        items: res.data.data.items || [],
        subtotal: res.data.data.subtotal || 0,
        tax: res.data.data.tax || 0,
        total: res.data.data.total || 0,
      };

      console.log('Setting selected patient:', updatedPatient);
      setSelectedPatient(updatedPatient);
      console.log('=== COMPLETED fetchPatientDetails ===');
    } catch (err) {
      console.error('=== ERROR in fetchPatientDetails ===', err);
      alert('Error loading patient details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingPatient(false);
    }
  };

  // ✅ 3. Handle adding a new charge
  const handleAddCharge = async () => {
    if (!selectedPatient || !newCharge.description || newCharge.unitPrice <= 0) return;

    try {
      await axios.post('/inpatient/api/bill-items', {
        encounter_id: selectedPatient.id,
        item_type: newCharge.category,
        description: newCharge.description,
        quantity: newCharge.quantity,
        unit_price: newCharge.unitPrice,
        amount: newCharge.quantity * newCharge.unitPrice,
      });

      await fetchPatientDetails(selectedPatient); // reload this patient’s bill
      setShowAddChargeModal(false);
      setNewCharge({ description: '', category: '', quantity: 1, unitPrice: 0 });
    } catch (error) {
      console.error('Failed to add charge:', error);
    }
  };

  // Handle service selection
  const handleServiceChange = (serviceId: string) => {
    setNewCharge({ ...newCharge, serviceId });
    
    // Find the selected service
    let foundService: Service | null = null;
    if (services) {
      Object.values(services).forEach(categoryServices => {
        const service = categoryServices.find(s => s.id.toString() === serviceId);
        if (service) foundService = service;
      });
    }
    
    setSelectedService(foundService);
  };

  // Handle editing a billing item
  const handleEditItem = (item: BillItem) => {
    setEditingItem(item);
    setEditForm({
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
    setShowEditModal(true);
  };

  // Handle updating a billing item
  const handleUpdateItem = async () => {
    if (!editingItem || !selectedPatient) return;

    try {
      await axios.put(`/inpatient/api/bill-items/${editingItem.id}`, {
        description: editForm.description,
        item_type: editForm.category,
        quantity: editForm.quantity,
        unit_price: editForm.unitPrice,
        amount: editForm.quantity * editForm.unitPrice,
      });

      // Reload patient details to refresh the list
      await fetchPatientDetails(selectedPatient);
      
      // Close modal and reset form
      setShowEditModal(false);
      setEditingItem(null);
      setEditForm({ description: '', category: '', quantity: 1, unitPrice: 0 });
      
      console.log('Billing item updated successfully');
      
    } catch (error) {
      console.error('Failed to update billing item:', error);
      alert('Failed to update billing item. Please try again.');
    }
  };

  // Handle deleting a billing item
  const handleDeleteItem = async (itemId: number) => {
    if (!selectedPatient) return;
    
    // Show confirmation dialog
    if (!confirm('Are you sure you want to remove this billing item?')) {
      return;
    }

    try {
      await axios.delete(`/inpatient/api/bill-items/${itemId}`);
      
      // Reload patient details to refresh the list
      await fetchPatientDetails(selectedPatient);
      
      // Show success message (you could use a toast notification here)
      console.log('Billing item removed successfully');
      
    } catch (error) {
      console.error('Failed to remove billing item:', error);
      alert('Failed to remove billing item. Please try again.');
    }
  };

  const generateDischargeSummary = (bill: PatientBill) => {
    console.log('Generating discharge summary for:', bill.patientName);
  };

  return (
    <HMSLayout>
      <Head title="Billing & Charges" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white border-b">
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Billing & Charges
        </h2>
        <button
          onClick={() => setShowAddChargeModal(true)}
          disabled={!selectedPatient}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-300"
        >
          + Add Charge
        </button>
      </div>

      {/* Layout */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 🧾 Left Panel: Patient List */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Active Patients</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading patients...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏥</div>
                <p className="text-gray-600 mb-2">No active patients</p>
                <p className="text-sm text-gray-500">Patients will appear here once admitted</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  {patients.length} active patient{patients.length !== 1 ? 's' : ''}
                </div>
                {patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      console.log('Patient clicked:', p);
                      fetchPatientDetails(p);
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      selectedPatient?.id === p.id
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{p.patientName}</div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            🛏️ Bed {p.bedNumber}
                          </span>
                          <span className="flex items-center">
                            📅 {new Date(p.admissionDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-green-600">
                            KES {(typeof p.total === 'number' ? p.total : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              p.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : p.status === 'discharged'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {selectedPatient?.id === p.id && (
                        <div className="ml-3 text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 💰 Right Panel: Bill Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                {loadingPatient ? (
                  <p className="text-gray-500">Loading charges...</p>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedPatient.patientName}
                        </h3>
                        <p className="text-gray-600">
                          Bed {selectedPatient.bedNumber} • Admitted:{' '}
                          {selectedPatient.admissionDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          KES {(typeof selectedPatient.total === 'number' ? selectedPatient.total : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-600">Total Bill</div>
                      </div>
                    </div>

                    {/* Bill Items Table */}
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Description', 'Category', 'Qty', 'Unit Price', 'Total', 'Date', 'Actions'].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedPatient.items && selectedPatient.items.length > 0 ? (
                            selectedPatient.items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                  {item.description}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {getCategoryLabel(item.category)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  KES {(typeof item.unitPrice === 'number' ? item.unitPrice : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                  KES {(typeof item.total === 'number' ? item.total : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">{item.date}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditItem(item)}
                                      className="inline-flex items-center px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 text-xs font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                      title="Edit this item"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="inline-flex items-center px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 text-xs font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                      title="Remove this item"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Del
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                No billing items yet. Click "Add Charge" to add the first item.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 flex justify-end">
                      <div className="w-64">
                        <div className="flex justify-between py-2">
                          <span>Subtotal:</span>
                          <span>KES {(typeof selectedPatient.subtotal === 'number' ? selectedPatient.subtotal : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span>Tax:</span>
                          <span>KES {(typeof selectedPatient.tax === 'number' ? selectedPatient.tax : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t font-bold text-lg">
                          <span>Total:</span>
                          <span>KES {(typeof selectedPatient.total === 'number' ? selectedPatient.total : 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={() => generateDischargeSummary(selectedPatient)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        📄 Discharge Summary
                      </button>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        🖨️ Print Bill
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white shadow-sm sm:rounded-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">💰</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Select a Patient
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Choose a patient from the list on the left to view their billing details, add charges, and manage payments.
                  </p>
                  
                  {patients.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        No active patients found. Patients will appear here once they are admitted to the inpatient ward.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">
                        <strong>{patients.length} active patient{patients.length !== 1 ? 's' : ''}</strong> available for billing management.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                      onClick={() => window.location.href = '/inpatient/dashboard'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📊 View Dashboard
                    </button>
                    <button 
                      onClick={() => window.location.href = '/billing/patients'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      👥 All Patient Billing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ➕ Premium Add Charge Modal */}
      {showAddChargeModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Add New Charge</h3>
                    <p className="text-blue-100 text-sm">Patient: {selectedPatient.patientName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddChargeModal(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <form className="space-y-6">
                {/* Service Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Select Service *
                  </label>
                  <div className="relative">
                    <select
                      value={newCharge.serviceId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-gray-800 appearance-none bg-white"
                    >
                      <option value="">Choose a service...</option>
                      {services && Object.keys(services).length > 0 ? (
                        Object.entries(services).map(([category, categoryServices]) => (
                          <optgroup key={category} label={category.replace('_', ' ').toUpperCase()}>
                            {categoryServices.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - KES {service.unit_price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per {service.unit_of_measure}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      ) : (
                        <option value="" disabled>Loading services...</option>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Selected Service Details */}
                {selectedService && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 rounded-full p-2 mt-1">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">{selectedService.name}</h4>
                        <p className="text-sm text-blue-700 mt-1">{selectedService.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {selectedService.category.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-blue-900">
                            KES {selectedService.unit_price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per {selectedService.unit_of_measure}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Quantity *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={newCharge.quantity}
                      onChange={(e) =>
                        setNewCharge({
                          ...newCharge,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-gray-800"
                      placeholder="Enter quantity"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                  </div>
                  {selectedService && (
                    <p className="text-xs text-gray-500">
                      Unit of measure: {selectedService.unit_of_measure}
                    </p>
                  )}
                </div>

                {/* Total Calculation */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                        <p className="text-xs text-gray-500">{newCharge.quantity || 0} × KES {(selectedService?.unit_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-700">
                        KES {((newCharge.quantity || 0) * (selectedService?.unit_price || 0)).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 rounded-b-2xl px-8 py-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddChargeModal(false)}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCharge}
                  disabled={!selectedService || newCharge.quantity <= 0}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Charge</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-700 rounded-t-2xl px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Edit Billing Item</h3>
                    <p className="text-orange-100 text-sm">Modify the selected billing item</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <form className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200 text-gray-800"
                    placeholder="Enter service description"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200 text-gray-800 appearance-none bg-white"
                  >
                    <option value="C">🩺 Consultation</option>
                    <option value="L">🧪 Laboratory Test</option>
                    <option value="R">📷 Radiology/Imaging</option>
                    <option value="M">💊 Medication</option>
                    <option value="P">🔧 Medical Procedure</option>
                    <option value="B">🏥 Room & Board</option>
                    <option value="S">🧤 Medical Supplies</option>
                  </select>
                </div>

                {/* Quantity and Unit Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200 text-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Unit Price (KES) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">KES</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.unitPrice}
                        onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200 text-gray-800"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Updated Total</p>
                        <p className="text-xs text-gray-500">{editForm.quantity} × KES {editForm.unitPrice.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-700">
                        KES {(editForm.quantity * editForm.unitPrice).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 rounded-b-2xl px-8 py-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateItem}
                  disabled={!editForm.description || editForm.unitPrice <= 0}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-700 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-amber-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update Item</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HMSLayout>
  );
}
