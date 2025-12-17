import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Bed, User, Heart, Thermometer, Activity, Droplets } from 'lucide-react';
import axios from 'axios';
import SearchableSelect from './SearchableSelect';

interface Patient {
  id: number;
  name: string;
  gender: string;
  age: number;
  diagnosis: string;
  admissionDate: string;
  status: string;
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
    recordedAt: string;
  };
}

interface BedData {
  id: number;
  number: string;
  ward: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  patient?: Patient;
}

interface WardData {
  id: string;
  name: string;
  beds: BedData[];
  stats: {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
}

interface WardStat {
  wardid: string;
  name: string;
  total_beds: number;
  beds_occupied: number;
  occupancy_rate: number;
}

interface BedOccupancyData {
  beds: BedData[];
  wards: WardData[];
  wardStats?: WardStat[];
  stats: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    cleaning: number;
    occupancyRate: number;
  };
  lastUpdated: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BedOccupancyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<BedOccupancyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bedTypeFilter, setBedTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchBedData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get CSRF token from meta tag
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      console.log('Fetching bed occupancy data...');
      const response = await axios.get('/inpatient/api/bed-occupancy', {
        headers: {
          'X-CSRF-TOKEN': token,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setData(response.data);
      console.log('✅ Bed occupancy data loaded successfully:', response.data);
    } catch (error: any) {
      console.error('❌ Error fetching bed occupancy data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load bed occupancy data';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBedData();
    }
  }, [isOpen]);

  // Auto-refresh removed to prevent interference with user activities
  // Users can manually refresh using the refresh button

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cleaning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Bed className="w-4 h-4" />;
      case 'occupied':
        return <User className="w-4 h-4" />;
      case 'maintenance':
        return <RefreshCw className="w-4 h-4" />;
      case 'cleaning':
        return <Droplets className="w-4 h-4" />;
      default:
        return <Bed className="w-4 h-4" />;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('BedOccupancyModal - Filters:', {
      selectedWard,
      patientSearch,
      statusFilter,
      bedTypeFilter
    });
  }, [selectedWard, patientSearch, statusFilter, bedTypeFilter]);

  const filteredWards = data?.wards.filter(ward => {
    // Filter by selected ward
    if (selectedWard !== 'all' && ward.name !== selectedWard) return false;
    return true;
  }).map(ward => {
    // Filter beds
    const filteredBeds = ward.beds.filter(bed => {
      // Status filter
      if (statusFilter !== 'all' && bed.status !== statusFilter) return false;

      // Bed type filter
      if (bedTypeFilter !== 'all' && bed.type.toLowerCase() !== bedTypeFilter.toLowerCase()) return false;

      // Patient search filter - only check if search is not empty
      if (patientSearch.trim()) {
        const hasPatient = bed.patient &&
          bed.patient.name.toLowerCase().includes(patientSearch.toLowerCase());
        return hasPatient;
      }

      // If we reach here, all filters pass (or are 'all')
      return true;
    });

    // Only include wards that have matching beds (after filtering)
    if (filteredBeds.length === 0) return null;

    // Recalculate stats based on filtered beds
    const occupiedBeds = filteredBeds.filter(b => b.status === 'occupied').length;
    const totalFilteredBeds = filteredBeds.length;
    const occupancyRate = totalFilteredBeds > 0 ? Math.round((occupiedBeds / totalFilteredBeds) * 100) : 0;

    return {
      ...ward,
      beds: filteredBeds,
      stats: {
        ...ward.stats,
        occupied: occupiedBeds,
        available: totalFilteredBeds - occupiedBeds,
        occupancyRate: occupancyRate
      }
    };
  }).filter(ward => ward !== null) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bed className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Real-Time Bed Occupancy Map
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                {data?.lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                  error ? 'bg-red-100 text-red-800' :
                  data ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {error ? '🔴 Error' : data ? '🟢 Live Data' : '⏳ Loading'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={fetchBedData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            {/* Overall Statistics */}
            {data?.stats && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Hospital Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">{data.stats.total}</div>
                    <div className="text-xs text-gray-600">Total Beds</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">{data.stats.available}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-red-600">{data.stats.occupied}</div>
                    <div className="text-xs text-gray-600">Occupied</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">{data.stats.occupancyRate}%</div>
                    <div className="text-xs text-gray-600">Occupancy</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Filter by Ward
                  {data?.wards && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({data.wards.length} wards available)
                    </span>
                  )}
                </h3>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All Wards' },
                    ...(data?.wards?.map(ward => ({
                      value: ward.name,
                      label: `${ward.name} (${ward.stats.occupied}/${ward.stats.total} beds)`
                    })) || [])
                  ]}
                  value={selectedWard}
                  onChange={(value) => {
                    console.log('Ward filter changed to:', value);
                    setSelectedWard(value);
                  }}
                  placeholder="Select a ward..."
                  className="text-sm"
                />
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Search Patient
                  {patientSearch && (
                    <span className="ml-2 text-xs text-blue-600">
                      (filtering...)
                    </span>
                  )}
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      console.log('Patient search changed to:', e.target.value);
                      setPatientSearch(e.target.value);
                    }}
                    placeholder="Search by patient name..."
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1 bg-white text-sm"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {patientSearch && (
                    <button
                      onClick={() => {
                        console.log('Clearing patient search');
                        setPatientSearch('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Bed Status</h3>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: '🟢 Available' },
                    { value: 'occupied', label: '🔵 Occupied' },
                    { value: 'maintenance', label: '🟡 Maintenance' },
                    { value: 'cleaning', label: '🟠 Cleaning' }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Select bed status..."
                  className="text-sm"
                />
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Bed Type</h3>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'general', label: '🛏️ General' },
                    { value: 'private', label: '🏨 Private' },
                    { value: 'icu', label: '🚨 ICU' },
                    { value: 'pediatric', label: '👶 Pediatric' }
                  ]}
                  value={bedTypeFilter}
                  onChange={setBedTypeFilter}
                  placeholder="Select bed type..."
                  className="text-sm"
                />
              </div>

              {/* Active Filters & Clear All */}
              {(selectedWard !== 'all' || patientSearch || statusFilter !== 'all' || bedTypeFilter !== 'all') && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    <button
                      onClick={() => {
                        setSelectedWard('all');
                        setPatientSearch('');
                        setStatusFilter('all');
                        setBedTypeFilter('all');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedWard !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Ward: {selectedWard}
                        <button
                          onClick={() => setSelectedWard('all')}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {patientSearch && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Patient: {patientSearch}
                        <button
                          onClick={() => setPatientSearch('')}
                          className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Status: {statusFilter}
                        <button
                          onClick={() => setStatusFilter('all')}
                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {bedTypeFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Type: {bedTypeFilter}
                        <button
                          onClick={() => setBedTypeFilter('all')}
                          className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results Counter */}
            {filteredWards && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                <div className="text-sm text-blue-900">
                  <span className="font-semibold">
                    {filteredWards.reduce((sum, ward) => sum + ward.beds.length, 0)}
                  </span>
                  {' '}beds found
                  {(selectedWard !== 'all' || patientSearch || statusFilter !== 'all' || bedTypeFilter !== 'all') && (
                    <span className="ml-2 text-blue-700">
                      (filtered from {data?.beds.length || 0} total)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Accurate Ward Statistics from SQL Query */}
            {data?.wardStats && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">📊 Live Ward Statistics</h3>
                <div className="space-y-2">
                  {data.wardStats.map(ward => (
                    <div key={ward.wardid} className="bg-white p-2 rounded border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{ward.name}</span>
                        <span className="text-blue-600 font-semibold">{ward.occupancy_rate}%</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>{ward.beds_occupied}/{ward.total_beds}</span>
                        <span>{ward.total_beds - ward.beds_occupied} free</span>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${Math.min(ward.occupancy_rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  📈 Total: {data.wardStats.reduce((sum, w) => sum + w.total_beds, 0)} beds •
                  🔴 Occupied: {data.wardStats.reduce((sum, w) => sum + w.beds_occupied, 0)} •
                  🟢 Available: {data.wardStats.reduce((sum, w) => sum + (w.total_beds - w.beds_occupied), 0)}
                </div>
              </div>
            )}

            {/* Ward Statistics */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Filtered Ward Statistics</h3>
              <div className="space-y-3">
                {filteredWards.map(ward => (
                  <div key={ward.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{ward.name}</h4>
                      <span className="text-sm font-medium text-purple-600">
                        {ward.stats.occupancyRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{ward.stats.occupied}/{ward.stats.total} occupied</span>
                      <span>{ward.stats.available} available</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${ward.stats.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading bed occupancy data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-400 text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchBedData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Retry
                  </button>
                </div>
              </div>
            ) : !data || filteredWards.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">
                  {!data ? '📊' : '🔍'}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {!data ? 'No Data Available' : 'No beds found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {!data
                    ? 'No bed occupancy data is currently available.'
                    : 'No beds match your current search criteria.'
                  }
                </p>
                {!data ? (
                  <button
                    onClick={fetchBedData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Load Data
                  </button>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">
                      {selectedWard !== 'all' && <div>Ward: {selectedWard}</div>}
                      {patientSearch && <div>Patient: "{patientSearch}"</div>}
                      {statusFilter !== 'all' && <div>Status: {statusFilter}</div>}
                      {bedTypeFilter !== 'all' && <div>Type: {bedTypeFilter}</div>}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWard('all');
                        setPatientSearch('');
                        setStatusFilter('all');
                        setBedTypeFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                    >
                      Clear All Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-6">
                {filteredWards.map(ward => (
                    <div key={ward.id} className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{ward.name}</h3>
                        <div className="text-sm text-gray-600">
                          {ward.beds.length} beds shown • {ward.stats.occupied}/{ward.stats.total} occupied ({ward.stats.occupancyRate}%)
                        </div>
                      </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {ward.beds.map(bed => (
                        <div
                          key={bed.id}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(bed.status)}`}
                          onClick={() => bed.patient && setSelectedPatient(bed.patient)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(bed.status)}
                              <span className="font-medium">Bed {bed.number}</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              bed.status === 'available' ? 'bg-green-500' :
                              bed.status === 'occupied' ? 'bg-blue-500' :
                              bed.status === 'maintenance' ? 'bg-yellow-500' :
                              'bg-amber-500'
                            }`} />
                          </div>

                          <div className="text-xs text-gray-600 mb-2">
                            {bed.type} • {bed.status}
                          </div>

                          {bed.patient ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm truncate">{bed.patient.name}</div>
                              <div className="text-xs text-gray-600">
                                {bed.patient.age}y • {bed.patient.gender}
                              </div>
                              {bed.patient.diagnosis && (
                                <div className="text-xs text-gray-500 truncate">
                                  {bed.patient.diagnosis}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">Empty</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Details Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Patient Details</h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedPatient.name}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.age} years old • {selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-1">Diagnosis</h5>
                  <p className="text-sm text-gray-600">{selectedPatient.diagnosis}</p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-1">Admission Date</h5>
                  <p className="text-sm text-gray-600">{selectedPatient.admissionDate}</p>
                </div>

                {selectedPatient.vitals && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Latest Vitals</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="text-sm font-medium">{selectedPatient.vitals.bloodPressure}</div>
                          <div className="text-xs text-gray-500">BP</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium">{selectedPatient.vitals.heartRate}</div>
                          <div className="text-xs text-gray-500">HR</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <div>
                          <div className="text-sm font-medium">{selectedPatient.vitals.temperature}°C</div>
                          <div className="text-xs text-gray-500">Temp</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                        <div>
                          <div className="text-sm font-medium">{selectedPatient.vitals.oxygenSaturation}%</div>
                          <div className="text-xs text-gray-500">SpO2</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Recorded: {new Date(selectedPatient.vitals.recordedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BedOccupancyModal;
