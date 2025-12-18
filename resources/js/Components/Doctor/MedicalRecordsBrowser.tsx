import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  TestTube,
  Stethoscope,
  Bed,
  Eye,
  Download,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Activity,
  Loader2
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  encounterType: 'OPD' | 'IPD' | 'Emergency';
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  vitals: {
    temperature: string;
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  labResults: {
    testName: string;
    result: string;
    normalRange: string;
    status: 'Normal' | 'Abnormal' | 'Critical';
  }[];
  medications: {
    name: string;
    dosage: string;
    duration: string;
  }[];
  notes: string;
  doctorName: string;
  department: string;
  followUpDate?: string;
  status: 'Active' | 'Completed' | 'Follow-up Required';
}

interface MedicalRecordsBrowserProps {
  onSelectRecord?: (record: MedicalRecord) => void;
}

// API service functions
const fetchMedicalRecords = async (params: any) => {
  try {
    const response = await window.axios.get('/doctor/api/medical-records', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching medical records:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch medical records');
  }
};

const fetchMedicalRecord = async (id: string) => {
  try {
    const response = await window.axios.get(`/doctor/api/medical-records/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching medical record:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch medical record');
  }
};

export default function MedicalRecordsBrowser({ onSelectRecord }: MedicalRecordsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEncounterType, setSelectedEncounterType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  const encounterTypes = ['All', 'OPD', 'IPD', 'Emergency'];
  const dateRanges = ['All Time', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months'];

  // Load medical records
  const loadRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        search: searchQuery || undefined,
        encounter_type: selectedEncounterType === 'All' ? undefined : selectedEncounterType,
        per_page: 20
      };

      // Handle date range filtering
      if (selectedDateRange && selectedDateRange !== 'All Time') {
        const now = new Date();
        let dateFrom: Date;

        switch (selectedDateRange) {
          case 'Last 7 days':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'Last 30 days':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'Last 3 months':
            dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'Last 6 months':
            dateFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        params.date_from = dateFrom.toISOString().split('T')[0];
      }

      const response = await fetchMedicalRecords(params);
      setRecords(response.data || []);
      setPagination({
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
        per_page: response.per_page || 20,
        total: response.total || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medical records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Load records on component mount and when filters change
  useEffect(() => {
    loadRecords();
  }, [searchQuery, selectedEncounterType, selectedDateRange]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadRecords();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRecordSelect = async (record: MedicalRecord) => {
    setLoading(true);
    try {
      // Fetch detailed record data
      const detailedRecord = await fetchMedicalRecord(record.id);
      setSelectedRecord(detailedRecord);
      setShowDetails(true);
      onSelectRecord?.(detailedRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Follow-up Required':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getEncounterTypeIcon = (type: string) => {
    switch (type) {
      case 'OPD':
        return <Stethoscope className="w-4 h-4" />;
      case 'IPD':
        return <Bed className="w-4 h-4" />;
      case 'Emergency':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getLabResultColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'text-green-600 dark:text-green-400';
      case 'Abnormal':
        return 'text-orange-600 dark:text-orange-400';
      case 'Critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Medical Records Browser
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse patient medical history, past visits, labs, and diagnoses
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedEncounterType}
                onChange={(e) => setSelectedEncounterType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                {encounterTypes.map(type => (
                  <option key={type} value={type === 'All' ? '' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                {dateRanges.map(range => (
                  <option key={range} value={range === 'All Time' ? '' : range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={loadRecords}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading medical records...</span>
          </div>
        )}

        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleRecordSelect(record)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                    {getEncounterTypeIcon(record.encounterType)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {record.patientName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {record.patientId} • {record.patientAge}y {record.patientGender}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Visit:</span>
                  <span className="text-gray-900 dark:text-white">{record.visitDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-white">{record.encounterType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                  <span className="text-gray-900 dark:text-white">{record.doctorName}</span>
                </div>
              </div>

              <div className="mb-3">
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">Diagnosis</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">{record.diagnosis}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{record.labResults.length} Lab Results</span>
                  <span>{record.medications.length} Medications</span>
                  <span>{record.department}</span>
                </div>
                <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && records.length === 0 && !error && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No medical records found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.per_page && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* Handle previous page */ }}
                disabled={pagination.current_page <= 1}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => {/* Handle next page */ }}
                disabled={pagination.current_page >= pagination.last_page}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Medical Record - {selectedRecord.patientName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedRecord.visitDate} • {selectedRecord.encounterType} • {selectedRecord.department}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Patient Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ID:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Age:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.patientAge} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.patientGender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.patientPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Vital Signs</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.vitals.temperature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">BP:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.vitals.bloodPressure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Heart Rate:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.vitals.heartRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Resp. Rate:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.vitals.respiratoryRate}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">O2 Saturation:</span>
                        <span className="text-gray-900 dark:text-white">{selectedRecord.vitals.oxygenSaturation}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Diagnosis</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      {selectedRecord.diagnosis}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Lab Results</h4>
                    <div className="space-y-2">
                      {selectedRecord.labResults.map((lab, index) => (
                        <div key={index} className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{lab.testName}</span>
                            <span className={`text-xs font-medium ${getLabResultColor(lab.status)}`}>
                              {lab.status}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Result:</span>
                              <span className="text-gray-900 dark:text-white">{lab.result}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Normal Range:</span>
                              <span className="text-gray-900 dark:text-white">{lab.normalRange}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Medications</h4>
                    <div className="space-y-2">
                      {selectedRecord.medications.map((med, index) => (
                        <div key={index} className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-white">{med.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {med.dosage} • {med.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Notes */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Doctor's Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  {selectedRecord.notes}
                </p>
              </div>

              {/* Follow-up */}
              {selectedRecord.followUpDate && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Follow-up Required</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Next appointment scheduled for {selectedRecord.followUpDate}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Record ID: {selectedRecord.id} • Created by {selectedRecord.doctorName}
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
