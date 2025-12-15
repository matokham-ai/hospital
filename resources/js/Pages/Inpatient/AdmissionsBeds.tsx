import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

import AdmissionModal from './components/AdmissionModal';
import BedOccupancyModal from './components/BedOccupancyModal';
import BedAssignmentModal from './components/BedAssignmentModal';
import { X, Bed, ArrowRightLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
interface Bed {
  id: number;
  number: string;
  ward: string;
  type: string; // Dynamic - can be any bed type from database
  status: string; // Dynamic - can be any status from database
  patient?: {
    id: number;
    encounterId?: number;
    name: string;
    admissionDate: string;
    gender?: string; // Dynamic - can be any gender from database
    age?: number;
    diagnosis?: string;
  };
}

interface WardStat {
  wardid: string;
  name: string;
  total_beds: number;
  beds_occupied: number;
  occupancy_rate: number;
}

interface Props {
  beds?: Bed[];
  wards?: string[];
  wardStats?: WardStat[];
}

// Live data only - no demo data fallback

export default function AdmissionsBeds({ beds, wards, wardStats }: Props) {
  // Use live data from backend only
  const bedsData = beds || [];
  const wardsData = wards || [];
  const wardStatsData = wardStats || [];

  // Debug logging
  console.log('AdmissionsBeds - Beds data:', bedsData);
  console.log('AdmissionsBeds - Wards data:', wardsData);
  console.log('AdmissionsBeds - Ward Stats:', wardStatsData);

  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedBedType, setSelectedBedType] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showBedOccupancyModal, setShowBedOccupancyModal] = useState(false);
  const [showBedAssignmentModal, setShowBedAssignmentModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    selectedWard: '',
    selectedBed: '',
    reason: ''
  });
  const [availableBeds, setAvailableBeds] = useState<Array<{ id: number, bed_number: string, bed_type: string, ward_name: string }>>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  // Discharge form state
  const [dischargeForm, setDischargeForm] = useState({
    dischargeType: '',
    dischargeSummary: '',
    followUp: '',
    dischargeCondition: 'stable'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debug selected filters whenever they change
  useEffect(() => {
    console.log('Selected filters:', { selectedWard, selectedBedType, selectedGender, selectedStatus });
  }, [selectedWard, selectedBedType, selectedGender, selectedStatus]);

  const filteredBeds = bedsData.filter(bed => {
    // Ward filter - normalize strings and handle nulls
    if (selectedWard !== 'all') {
      const bedWard = (bed.ward || '').trim();
      const filterWard = selectedWard.trim();

      // Debug logging for ward filter
      if (bedWard !== filterWard) {
        console.log(`Ward filter excluding bed ${bed.number}: "${bedWard}" !== "${filterWard}"`);
      }

      if (bedWard !== filterWard) return false;
    }

    // Bed type filter
    if (selectedBedType !== 'all' && bed.type.toLowerCase() !== selectedBedType.toLowerCase()) return false;

    // Status filter
    if (selectedStatus !== 'all' && bed.status !== selectedStatus) return false;    // Gender filter - only apply to beds with patients
    if (selectedGender !== 'all') {
      // If no patient, exclude this bed when filtering by gender
      if (!bed.patient) return false;
      // Compare gender values (normalize to uppercase for comparison)
      const patientGender = bed.patient.gender?.toUpperCase();
      const filterGender = selectedGender.toUpperCase();
      if (patientGender !== filterGender) return false;
    }

    // Search functionality
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesBedNumber = bed.number.toLowerCase().includes(searchLower);
      const matchesWard = bed.ward.toLowerCase().includes(searchLower);
      const matchesPatientName = bed.patient?.name?.toLowerCase().includes(searchLower);
      const matchesDiagnosis = bed.patient?.diagnosis?.toLowerCase().includes(searchLower);

      if (!matchesBedNumber && !matchesWard && !matchesPatientName && !matchesDiagnosis) {
        return false;
      }
    }

    return true;
  });

  // Debug filtered results
  console.log(`Filtered beds: ${filteredBeds.length} out of ${bedsData.length} total beds`);
  if (selectedWard !== 'all') {
    console.log(`Ward "${selectedWard}" beds:`, filteredBeds.map(b => ({ number: b.number, ward: b.ward })));
  }


  // Pagination logic
  const totalPages = Math.ceil(filteredBeds.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBeds = filteredBeds.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    console.log('Filters changed, resetting to page 1:', { selectedWard, selectedBedType, selectedGender, selectedStatus, searchTerm });
    setCurrentPage(1);
  }, [selectedWard, selectedBedType, selectedGender, selectedStatus, searchTerm]);

  // Calculate accurate statistics from ward stats (SQL query results) or fallback to bed data
  const stats = wardStatsData.length > 0 ? {
    // Use accurate SQL query results
    total: wardStatsData.reduce((sum, w) => sum + w.total_beds, 0),
    available: wardStatsData.reduce((sum, w) => sum + (w.total_beds - w.beds_occupied), 0),
    occupied: wardStatsData.reduce((sum, w) => sum + w.beds_occupied, 0),
    maintenance: bedsData.filter(b => b.status === 'maintenance').length,
    cleaning: bedsData.filter(b => b.status === 'cleaning').length,
    occupancyRate: Math.round((wardStatsData.reduce((sum, w) => sum + w.beds_occupied, 0) /
      wardStatsData.reduce((sum, w) => sum + w.total_beds, 0)) * 100)
  } : {
    // Fallback to individual bed data if ward stats not available
    total: bedsData.length,
    available: bedsData.filter(b => b.status === 'available').length,
    occupied: bedsData.filter(b => b.status === 'occupied').length,
    maintenance: bedsData.filter(b => b.status === 'maintenance').length,
    cleaning: bedsData.filter(b => b.status === 'cleaning').length,
    occupancyRate: bedsData.length > 0 ? Math.round((bedsData.filter(b => b.status === 'occupied').length / bedsData.length) * 100) : 0
  };

  // Debug logging for stats
  console.log('AdmissionsBeds - Calculated Stats:', stats);
  console.log('AdmissionsBeds - Using Ward Stats:', wardStatsData.length > 0);
  if (wardStatsData.length > 0) {
    console.log('AdmissionsBeds - Ward Stats Breakdown:', wardStatsData.map(w => ({
      ward: w.name,
      total_beds: w.total_beds,
      beds_occupied: w.beds_occupied,
      occupancy_rate: w.occupancy_rate
    })));
  }

  // Calculate bed type breakdown
  const bedTypeStats = {
    general: filteredBeds.filter(b => b.type === 'general').length,
    private: filteredBeds.filter(b => b.type === 'private').length,
    icu: filteredBeds.filter(b => b.type === 'icu').length,
    pediatric: filteredBeds.filter(b => b.type === 'pediatric').length,
  };



  const handleAdmitPatient = (bed: Bed) => {
    setSelectedBed(bed);
    setShowAdmissionModal(true);
  };

  const handleTransferPatient = (bed: Bed) => {
    setSelectedBed(bed);
    setTransferForm({ selectedWard: '', selectedBed: '', reason: '' });
    setShowTransferModal(true);
    fetchAvailableBeds();
  };

  // Fetch available beds for transfer
  const fetchAvailableBeds = async () => {
    setLoadingBeds(true);
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch('/inpatient/api/available-beds-list', {
        headers: {
          'X-CSRF-TOKEN': token || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableBeds(data.available_beds || []);
      } else {
        console.error('Failed to fetch available beds');
        setAvailableBeds([]);
      }
    } catch (error) {
      console.error('Error fetching available beds:', error);
      setAvailableBeds([]);
    } finally {
      setLoadingBeds(false);
    }
  };

  // Handle transfer form submission
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transferForm.selectedBed || !transferForm.reason.trim()) {
      alert('Please select a bed and provide a reason for transfer');
      return;
    }

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch(`/inpatient/api/transfer-patient/${selectedBed?.patient?.encounterId}`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': token || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bed_id: transferForm.selectedBed,
          reason: transferForm.reason
        })
      });

      if (response.ok) {
        alert('Patient transferred successfully');
        setShowTransferModal(false);
        window.location.reload(); // Refresh to show updated bed assignments
      } else {
        const errorData = await response.json();
        alert(`Transfer failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error transferring patient:', error);
      alert('Transfer failed. Please try again.');
    }
  };

  const handleDischargePatient = (bed: Bed) => {
    setSelectedBed(bed);
    setShowDischargeModal(true);
    // Reset form
    setDischargeForm({
      dischargeType: '',
      dischargeSummary: '',
      followUp: '',
      dischargeCondition: 'stable'
    });
  };

  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBed || !selectedBed.patient) {
      alert('No patient selected for discharge');
      return;
    }

    try {
      // Debug: Log the selected bed and patient data
      console.log('Selected bed for discharge:', selectedBed);
      console.log('Patient data:', selectedBed.patient);
      console.log('Encounter ID:', selectedBed.patient.encounterId);
      console.log('Patient ID fallback:', selectedBed.patient.id);

      const encounterId = selectedBed.patient.encounterId || selectedBed.patient.id;
      console.log('Using encounter_id:', encounterId);

      if (!selectedBed.patient.encounterId) {
        alert('Warning: No encounter ID found. This patient may not be properly admitted as an inpatient.');
        return;
      }

      const response = await fetch('/inpatient/api/discharge-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          encounter_id: selectedBed.patient.encounterId,
          discharge_datetime: new Date().toISOString(),
          discharge_summary: dischargeForm.dischargeSummary,
          discharge_condition: dischargeForm.dischargeCondition,
          discharge_notes: `Discharge type: ${dischargeForm.dischargeType}. Follow-up: ${dischargeForm.followUp}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discharge response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`Patient ${selectedBed.patient.name} successfully discharged from Bed ${selectedBed.number}!`);
        setShowDischargeModal(false);
        setSelectedBed(null);
        // Refresh the page to show updated bed status
        window.location.reload();
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        alert('Error discharging patient: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        alert('Server returned an invalid response. Please check if you have the necessary permissions and try again.');
      } else {
        alert(`Error discharging patient: ${error.message || 'Please try again.'}`);
      }
    }
  };

  const handleAdmissionSubmit = async (admissionData: any) => {
    try {
      console.log('Processing admission:', admissionData);

      // The admission data comes from the modal with the API response
      // The actual API call is already handled in the AdmissionModal component

      if (admissionData.result && admissionData.result.success) {
        // Find the patient and bed info for the success message
        const patientName = selectedBed?.patient?.name || 'Patient';
        const bedNumber = selectedBed?.number || 'Unknown';

        alert(`Patient successfully admitted to Bed ${bedNumber}!`);

        // Close the modal and refresh
        setShowAdmissionModal(false);
        setSelectedBed(null);
        window.location.reload();
      } else {
        // Handle API error from the modal
        const errorMessage = admissionData.result?.message || 'Unknown error occurred';
        alert(`Admission failed: ${errorMessage}`);
      }

    } catch (error) {
      console.error('Error processing admission:', error);
      alert('Error processing admission. Please try again.');
    }
  };

  const handleBedClick = (patient: any) => {
    // Handle bed click from map - could open patient details
    console.log('Bed clicked:', patient);
  };

  // Format bed type for display
  const formatBedType = (type: string) => {
    switch (type) {
      case 'general': return 'General';
      case 'private': return 'Private';
      case 'icu': return 'ICU';
      case 'pediatric': return 'Pediatric';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'maintenance': return 'Maintenance';
      case 'cleaning': return 'Cleaning';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Format gender for display - dynamic and extensible
  const formatGender = (gender: string) => {
    switch (gender?.toUpperCase()) {
      case 'M':
      case 'MALE':
        return 'Male';
      case 'F':
      case 'FEMALE':
        return 'Female';
      case 'O':
      case 'OTHER':
        return 'Other';
      default:
        return gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : 'Unknown';
    }
  };

  // Get gender emoji - dynamic and extensible
  const getGenderEmoji = (gender: string) => {
    switch (gender?.toUpperCase()) {
      case 'M':
      case 'MALE':
        return '👨';
      case 'F':
      case 'FEMALE':
        return '👩';
      default:
        return '🧑';
    }
  };

  return (
    <HMSLayout>
      <Head title="Admissions & Beds" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white border-b">
        <div>
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Admissions & Beds
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${bedsData.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {bedsData.length > 0 ? '🟢 Live Data' : '🔴 No Data'}
            </span>
            <span className="text-sm text-gray-500">
              {bedsData.length} beds loaded
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAdmissionModal(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            + New Admission
          </button>
          <button
            onClick={() => setShowBedAssignmentModal(true)}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          >
            🛏️ Assign Beds
          </button>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Hospital Overview</h3>
            <span className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${wardStatsData.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
              {wardStatsData.length > 0 ? '🟢 Live Database Stats' : '⚠️ Calculated from Bed Data'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600">Total Beds</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600">{stats.available}</div>
              <div className="text-gray-600">Available</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-red-600">{stats.occupied}</div>
              <div className="text-gray-600">Occupied</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-yellow-600">{stats.maintenance}</div>
              <div className="text-gray-600">Maintenance</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-amber-600">{stats.cleaning}</div>
              <div className="text-gray-600">Cleaning</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600">{stats.occupancyRate}%</div>
              <div className="text-gray-600">Occupancy Rate</div>
            </div>
          </div>

          {/* Bed Type Breakdown */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">🏥 Bed Type Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{bedTypeStats.general}</div>
                  <div className="text-sm text-blue-700">🛏️ General</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{bedTypeStats.private}</div>
                  <div className="text-sm text-purple-700">🏨 Private</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{bedTypeStats.icu}</div>
                  <div className="text-sm text-red-700">🚨 ICU</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <div className="text-2xl font-bold text-pink-600">{bedTypeStats.pediatric}</div>
                  <div className="text-sm text-pink-700">👶 Pediatric</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ward Statistics Summary */}
          {wardStatsData.length > 0 && (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Ward Summary (Live Database)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ward
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Beds
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Occupied
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Available
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Occupancy Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wardStatsData.map((ward) => (
                        <tr key={ward.wardid}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ward.name}
                            <div className="text-xs text-gray-500">{ward.wardid}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="text-lg font-semibold text-blue-600">{ward.total_beds}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="text-lg font-semibold text-red-600">{ward.beds_occupied}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="text-lg font-semibold text-green-600">
                              {ward.total_beds - ward.beds_occupied}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className={`text-lg font-semibold ${ward.occupancy_rate >= 90 ? 'text-red-600' :
                                  ward.occupancy_rate >= 70 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                  {ward.occupancy_rate}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className={`h-2 rounded-full ${ward.occupancy_rate >= 90 ? 'bg-red-500' :
                                      ward.occupancy_rate >= 70 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                    style={{ width: `${Math.min(ward.occupancy_rate, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  📈 Total: {wardStatsData.reduce((sum, w) => sum + w.total_beds, 0)} beds •
                  🔴 Occupied: {wardStatsData.reduce((sum, w) => sum + w.beds_occupied, 0)} •
                  🟢 Available: {wardStatsData.reduce((sum, w) => sum + (w.total_beds - w.beds_occupied), 0)} •
                  📊 Overall Occupancy: {wardStatsData.length > 0 ?
                    Math.round((wardStatsData.reduce((sum, w) => sum + w.beds_occupied, 0) /
                      wardStatsData.reduce((sum, w) => sum + w.total_beds, 0)) * 100) : 0}%
                </div>
              </div>
            </div>
          )}



          {/* Enhanced Quick Filters */}
          <div className="bg-white shadow-sm sm:rounded-lg mb-6 relative">
            <div className="p-6">
              {/* Header with Results Count */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    🔍 Quick Filters
                    <span className="ml-3 text-sm font-normal text-gray-500">
                      ({filteredBeds.length} of {bedsData.length} beds)
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Filter beds by ward, type, or patient gender
                  </p>
                </div>

                {/* Clear All Button - Always Visible */}
                <button
                  onClick={() => {
                    setSelectedWard('all');
                    setSelectedBedType('all');
                    setSelectedGender('all');
                    setSelectedStatus('all');
                    setCurrentPage(1);
                  }}
                  disabled={selectedWard === 'all' && selectedBedType === 'all' && selectedGender === 'all' && selectedStatus === 'all'}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear All Filters
                </button>
              </div>

              {/* Active Filters Tags */}
              {(selectedWard !== 'all' || selectedBedType !== 'all' || selectedGender !== 'all' || selectedStatus !== 'all') && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">Active filters:</span>
                    {selectedWard !== 'all' && (
                      <span className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                        <span className="mr-1">🏥</span>
                        {selectedWard}
                        <button
                          onClick={() => setSelectedWard('all')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedBedType !== 'all' && (
                      <span className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full border border-purple-300">
                        <span className="mr-1">
                          {selectedBedType === 'general' ? '🛏️' :
                            selectedBedType === 'private' ? '🏨' :
                              selectedBedType === 'icu' ? '🚨' : '👶'}
                        </span>
                        {formatBedType(selectedBedType)}
                        <button
                          onClick={() => setSelectedBedType('all')}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedGender !== 'all' && (
                      <span className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full border border-green-300">
                        <span className="mr-1">
                          {getGenderEmoji(selectedGender)}
                        </span>
                        {formatGender(selectedGender)}
                        <button
                          onClick={() => setSelectedGender('all')}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedStatus !== 'all' && (
                      <span className="inline-flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full border border-orange-300">
                        <span className="mr-1">
                          {selectedStatus === 'available' ? '✅' :
                            selectedStatus === 'occupied' ? '🔴' :
                              selectedStatus === 'maintenance' ? '🔧' : '🧹'}
                        </span>
                        {selectedStatus === 'available' ? 'Available' :
                          selectedStatus === 'occupied' ? 'Occupied' :
                            selectedStatus === 'maintenance' ? 'Maintenance' : 'Cleaning'}
                        <button
                          onClick={() => setSelectedStatus('all')}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🏥 Ward ({wardsData.length} available)
                  </label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Wards</option>
                    {wardsData.map(ward => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🛏️ Bed Type
                  </label>
                  <select
                    value={selectedBedType}
                    onChange={(e) => setSelectedBedType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="general">🛏️ General</option>
                    <option value="private">🏨 Private</option>
                    <option value="icu">🚨 ICU</option>
                    <option value="pediatric">👶 Pediatric</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📊 Bed Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">✅ Available</option>
                    <option value="occupied">🔴 Occupied</option>
                    <option value="maintenance">🔧 Maintenance</option>
                    <option value="cleaning">🧹 Cleaning</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    👤 Patient Gender
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Genders</option>
                    <option value="M">👨 Male Patients</option>
                    <option value="F">👩 Female Patients</option>
                    <option value="O">🧑 Other</option>
                  </select>
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Quick filters:</span>
                  <button
                    onClick={() => {
                      setSelectedWard('all');
                      setSelectedBedType('all');
                      setSelectedGender('all');
                      setSelectedStatus('all');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    🏥 All Beds
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWard('all');
                      setSelectedBedType('all');
                      setSelectedGender('all');
                      setSelectedStatus('available');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    ✅ Available Only
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWard('all');
                      setSelectedBedType('icu');
                      setSelectedGender('all');
                      setSelectedStatus('all');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                  >
                    🚨 ICU Beds
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWard('all');
                      setSelectedBedType('pediatric');
                      setSelectedGender('all');
                      setSelectedStatus('all');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                  >
                    👶 Pediatric
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Map Button */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">🏥 Bed Occupancy Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View detailed bed occupancy with live patient data and interactive ward layout
                  </p>
                </div>
                <button
                  onClick={() => setShowBedOccupancyModal(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center gap-2"
                >
                  📊 View Real-Time Map
                </button>
              </div>
            </div>
          </div>

          {/* Bed List */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bed Details</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search beds, patients, wards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bedsData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <div className="text-4xl mb-4">📊</div>
                            <div className="text-lg font-medium mb-2">No Bed Data Available</div>
                            <div className="text-sm">
                              No bed information is currently loaded from the database.
                              <br />
                              Please check if the bed data is properly configured.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBeds.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <div className="text-4xl mb-4">🔍</div>
                            <div className="text-lg font-medium mb-2">No beds found</div>
                            <div className="text-sm">
                              Try adjusting your filters:
                              {selectedWard !== 'all' && <span className="block">Ward: {selectedWard}</span>}
                              {selectedBedType !== 'all' && <span className="block">Bed Type: {formatBedType(selectedBedType)}</span>}
                              {selectedGender !== 'all' && <span className="block">Gender: {formatGender(selectedGender)}</span>}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedWard('all');
                                setSelectedBedType('all');
                                setSelectedGender('all');
                                setSelectedStatus('all');
                                setCurrentPage(1);
                              }}
                              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                            >
                              Clear All Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedBeds.map((bed) => (
                        <tr key={bed.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {bed.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bed.ward}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bed.type === 'icu' ? 'bg-red-50 text-red-700 border border-red-200' :
                              bed.type === 'private' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                bed.type === 'pediatric' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                              {formatBedType(bed.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bed.status === 'available' ? 'bg-green-100 text-green-800' :
                              bed.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                bed.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-amber-100 text-amber-800'
                              }`}>
                              {formatStatus(bed.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bed.patient ? (
                              <div>
                                <div className="font-medium text-gray-900">{bed.patient.name}</div>
                                <div className="text-xs text-gray-500">
                                  {bed.patient.age && `${bed.patient.age}y`}
                                  {bed.patient.gender && ` • ${formatGender(bed.patient.gender)}`}
                                </div>
                                {bed.patient.diagnosis && (
                                  <div className="text-xs text-gray-500">{bed.patient.diagnosis}</div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {bed.status === 'available' ? (
                              <button
                                onClick={() => handleAdmitPatient(bed)}
                                className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                🏥 Admit
                              </button>
                            ) : bed.status === 'occupied' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleTransferPatient(bed)}
                                  className="bg-yellow-500 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  🔄 Transfer
                                </button>
                                <button
                                  onClick={() => handleDischargePatient(bed)}
                                  className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  ✅ Discharge
                                </button>
                              </div>
                            ) : bed.status === 'maintenance' ? (
                              <span className="text-gray-400 text-xs">🔧 Maintenance</span>
                            ) : (
                              <span className="text-amber-600 text-xs">🧹 Cleaning</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredBeds.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredBeds.length)} of {filteredBeds.length} beds
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Show:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-700">per page</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNum
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Admission Modal */}
      <AdmissionModal
        open={showAdmissionModal}
        onClose={() => {
          setShowAdmissionModal(false);
          setSelectedBed(null);
        }}
        bed={selectedBed}
        onSubmit={handleAdmissionSubmit}
      />

      {/* Transfer Modal */}

      {showTransferModal && selectedBed && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 animate-in fade-in zoom-in duration-200">

            {/* Close button (top-right) */}
            <button
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                🔄
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transfer Patient
              </h3>
            </div>

            {/* Patient summary */}
            <div className="mb-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="font-medium text-gray-900 dark:text-white">{selectedBed.patient?.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current: {selectedBed.ward} – Bed {selectedBed.number}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleTransferSubmit} className="space-y-5">
              {/* Select Ward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transfer to Ward
                </label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Select Ward" },
                    ...wardsData
                      .filter((w) => w !== selectedBed.ward)
                      .map((ward) => ({ value: ward, label: ward })),
                  ]}
                  value={transferForm.selectedWard}
                  onChange={(value) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      selectedWard: value,
                      selectedBed: "",
                    }))
                  }
                  placeholder="Search and select ward..."
                />
              </div>

              {/* Select Bed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Beds
                </label>
                {loadingBeds ? (
                  <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Loading available beds...
                  </div>
                ) : (
                  <SearchableSelect
                    options={[
                      { value: "", label: "Select Bed" },
                      ...availableBeds
                        .filter(
                          (bed) =>
                            !transferForm.selectedWard ||
                            bed.ward_name === transferForm.selectedWard
                        )
                        .map((bed) => ({
                          value: bed.id.toString(),
                          label: `${bed.ward_name} – Bed ${bed.bed_number} (${bed.bed_type})`,
                        })),
                    ]}
                    value={transferForm.selectedBed}
                    onChange={(value) =>
                      setTransferForm((prev) => ({ ...prev, selectedBed: value }))
                    }
                    placeholder="Search and select bed..."
                  />
                )}
                {availableBeds.length === 0 && !loadingBeds && (
                  <p className="text-xs text-gray-500 mt-1">No available beds found</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Transfer
                </label>
                <textarea
                  value={transferForm.reason}
                  onChange={(e) =>
                    setTransferForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  rows={3}
                  className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter reason for transfer..."
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-5 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!transferForm.selectedBed || !transferForm.reason.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Discharge Modal */}
      {showDischargeModal && selectedBed && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ✅ Discharge Patient from Bed {selectedBed.number}
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="font-medium">{selectedBed.patient?.name}</div>
                <div className="text-sm text-gray-600">
                  Admitted: {selectedBed.patient?.admissionDate}
                </div>
              </div>
              <form onSubmit={handleDischargeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discharge Type</label>
                  <select
                    value={dischargeForm.dischargeType}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeType: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="home">Discharge to Home</option>
                    <option value="transfer">Transfer to Another Facility</option>
                    <option value="deceased">Deceased</option>
                    <option value="ama">Against Medical Advice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discharge Summary</label>
                  <textarea
                    value={dischargeForm.dischargeSummary}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeSummary: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter discharge summary and instructions"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Required</label>
                  <select
                    value={dischargeForm.followUp}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, followUp: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="no">No Follow-up</option>
                    <option value="1week">1 Week</option>
                    <option value="2weeks">2 Weeks</option>
                    <option value="1month">1 Month</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDischargeModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Discharge Patient
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Bed Occupancy Modal */}
      <BedOccupancyModal
        isOpen={showBedOccupancyModal}
        onClose={() => setShowBedOccupancyModal(false)}
      />

      {/* Bed Assignment Modal */}
      <BedAssignmentModal
        open={showBedAssignmentModal}
        onClose={() => setShowBedAssignmentModal(false)}
        onSuccess={() => {
          setShowBedAssignmentModal(false);
          // Refresh the page to show updated bed assignments
          window.location.reload();
        }}
      />
    </HMSLayout>
  );
}
