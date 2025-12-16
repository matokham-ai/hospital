import React, { useState, useEffect } from "react";
import { X, Search, User, Bed, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: "M" | "F" | "O";
  diagnosis: string;
  admissionDate: string;
  encounterId: number;
}

interface Bed {
  id: number;
  number: string;
  ward: string;
  type: string;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BedAssignmentModal({ open, onClose, onSuccess }: Props) {
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [loading, setLoading] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchUnassignedPatients();
      fetchAvailableBeds();
    }
  }, [open]);

  const fetchUnassignedPatients = async () => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await fetch('/inpatient/api/unassigned-patients', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token || '',
        },
        credentials: 'same-origin',
      });

      if (response.ok) {
        const patients = await response.json();
        setUnassignedPatients(patients);
      } else {
        console.error('Failed to fetch unassigned patients');
        setUnassignedPatients([]);
      }
    } catch (error) {
      console.error('Error fetching unassigned patients:', error);
      setUnassignedPatients([]);
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await fetch('/inpatient/api/bed-occupancy', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token || '',
        },
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data = await response.json();
        const available = data.beds.filter((bed: Bed) => bed.status === 'available');
        setAvailableBeds(available);
      }
    } catch (error) {
      console.error('Error fetching available beds:', error);
    }
  };

  const handleAssignBed = async () => {
    if (!selectedPatient || !selectedBed) {
      alert("Please select both a patient and a bed");
      return;
    }

    setLoading(true);
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await fetch('/inpatient/api/assign-bed', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token || '',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          encounter_id: selectedPatient.encounterId,
          bed_id: selectedBed.id,
          assignment_notes: assignmentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign bed');
      }

      alert('Bed assigned successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleClose();
      
    } catch (error) {
      console.error('Error assigning bed:', error);
      alert(`Error assigning bed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPatient(null);
    setSelectedBed(null);
    setAssignmentNotes("");
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🛏️ Assign Bed to Patient</h2>
              <p className="text-sm text-gray-600">
                Assign available beds to admitted patients
              </p>
            </div>
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Unassigned Patients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600" />
                  Patients Without Beds
                </h3>
                
                {unassignedPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No unassigned patients found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {unassignedPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-600">
                          {patient.age}y, {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Diagnosis: {patient.diagnosis}
                        </div>
                        <div className="text-sm text-gray-500">
                          Admitted: {patient.admissionDate}
                        </div>
                        {selectedPatient?.id === patient.id && (
                          <div className="mt-2 text-sm text-blue-600 font-medium">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Beds */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-green-600" />
                  Available Beds
                </h3>
                
                {availableBeds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No available beds found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {availableBeds.map((bed) => (
                      <div
                        key={bed.id}
                        onClick={() => setSelectedBed(bed)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedBed?.id === bed.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">
                          Bed {bed.number}
                        </div>
                        <div className="text-sm text-gray-600">
                          Ward: {bed.ward}
                        </div>
                        <div className="text-sm text-gray-600">
                          Type: {bed.type.charAt(0).toUpperCase() + bed.type.slice(1)}
                        </div>
                        <div className="text-sm text-green-600">
                          ✓ Available
                        </div>
                        {selectedBed?.id === bed.id && (
                          <div className="mt-2 text-sm text-green-600 font-medium">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Notes */}
            {selectedPatient && selectedBed && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Assignment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Patient:</div>
                    <div className="font-medium">{selectedPatient.name}</div>
                    <div className="text-sm text-gray-500">{selectedPatient.diagnosis}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Bed:</div>
                    <div className="font-medium">Bed {selectedBed.number}</div>
                    <div className="text-sm text-gray-500">{selectedBed.ward} • {selectedBed.type}</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any notes about this bed assignment..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedPatient && selectedBed ? (
                <span className="text-green-600">✓ Ready to assign bed</span>
              ) : (
                <span>Please select a patient and an available bed</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignBed}
                disabled={!selectedPatient || !selectedBed || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {loading ? 'Assigning...' : 'Assign Bed'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
